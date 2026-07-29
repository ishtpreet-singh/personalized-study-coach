"""
Auth Service — Business Logic Layer

Fixes applied in this revision:

FIX #8  (HIGH):   UUID(user_id) now wrapped in try/except ValueError.
                   A malformed 'sub' claim used to raise ValueError → 500.
                   Now raises 401 Unauthorized with a clear message.

FIX #9  (HIGH):   Google OAuth profile["id"] and profile["email"] now use .get()
                   with explicit None checks and a 502 Bad Gateway on missing fields.
                   Previously, absent fields caused KeyError → unhandled 500.

FIX #11 (MEDIUM): is_active check moved BEFORE verify_password in login().
                   bcrypt is intentionally slow — wasting it on deactivated accounts
                   creates unnecessary CPU load and potential DoS surface.

FIX #27 (LOW):    Refresh token rotation — on every /auth/refresh call, a new
                   refresh token is issued and the old one is added to the blacklist.
                   This limits the blast radius of a stolen refresh token.

Architecture unchanged:
  Routes → Services → Repositories → Models → PostgreSQL
"""

import logging
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from jwt.exceptions import InvalidTokenError, PyJWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_pre_auth_token,
    create_refresh_token,
    decode_token,
    extract_jti_and_remaining_ttl,
    hash_password,
    verify_password,
)
from app.core.token_blacklist import token_blacklist
from app.core.totp import (
    generate_totp_secret,
    generate_qr_code_base64,
    get_totp_uri,
    verify_totp,
)
from app.models.user import User
from app.repositories.user_repository import user_repository
from app.schemas.auth import AccessTokenResponse, PreAuthTokenResponse, TokenResponse, TwoFactorSetupResponse
from app.schemas.user import UserCreate
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


class AuthService:
    """
    Handles all authentication business logic.

    All methods raise HTTPException on failure — FastAPI converts these
    to proper HTTP error responses automatically.

    Never touches the database directly — all DB access goes through
    user_repository, which calls flush() (not commit()).
    """

    # ── Registration ───────────────────────────────────────────

    async def register(
        self, db: AsyncSession, *, user_in: UserCreate
    ) -> User:
        """
        Register a new user account.

        Steps:
          1. Check email uniqueness (SQL EXISTS — no full row fetch)
          2. Hash the password
          3. Persist via UserRepository
          4. Return the created User ORM instance

        Raises:
          409 Conflict if the email is already registered.
        """
        if await user_repository.email_exists(db, email=user_in.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An account with email '{user_in.email}' already exists.",
            )

        hashed = hash_password(user_in.password)
        verification_token = secrets.token_urlsafe(32)
        verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)

        user_data = {
            "email": user_in.email.lower().strip(),
            "full_name": user_in.full_name.strip(),
            "hashed_password": hashed,
            "is_active": True,
            "is_verified": False,
            "is_superuser": False,
            "verification_token": verification_token,
            "verification_token_expires": verification_token_expires,
        }

        user = await user_repository.create_from_dict(db, obj_in=user_data)
        logger.info(f"New user registered: {user.email} ({user.id})")
        
        await email_service.send_verification_email(user.email, verification_token)
        
        return user

    # ── Login ──────────────────────────────────────────────────

    async def login(
        self, db: AsyncSession, *, email: str, password: str
    ) -> TokenResponse | PreAuthTokenResponse:
        """
        Authenticate with email + password.

        Phase 1.5: If the user has 2FA enabled, instead of issuing full tokens
        we issue a short-lived pre_auth_token (5 min) and return requires_2fa=True.
        The client then calls POST /auth/2fa/login with the pre_auth_token + OTP.

        FIX #11: is_active checked BEFORE verify_password.
        """
        user = await user_repository.get_by_email(db, email=email)

        if not user or not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated.",
            )

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in.",
            )

        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Phase 1.5: Gate on 2FA
        if user.two_factor_enabled:
            pre_auth_token = create_pre_auth_token(subject=str(user.id))
            logger.info(f"2FA required for user {user.email} — pre_auth_token issued")
            return PreAuthTokenResponse(pre_auth_token=pre_auth_token)

        # Standard path — no 2FA
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        logger.info(f"User logged in: {user.email} ({user.id})")
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    # ── Token Refresh ──────────────────────────────────────────

    async def refresh_access_token(
        self, db: AsyncSession, *, refresh_token: str
    ) -> AccessTokenResponse:
        """
        Validate a refresh token, blacklist it, and issue new token pair.

        FIX #8  (HIGH):   UUID(user_id) now guarded — ValueError → 401 not 500.
        FIX #27 (LOW):    Refresh token rotation — the old refresh token is
                           blacklisted and a new one is issued. This limits the
                           blast radius of a stolen refresh token.

        Raises:
          401 Unauthorized if the refresh token is invalid, expired, blacklisted,
          or references a non-existent/inactive user.
        """
        invalid_token_error = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        # Decode and validate signature/expiry
        try:
            payload = decode_token(refresh_token)
        except (InvalidTokenError, PyJWTError):
            raise invalid_token_error

        # Enforce token type
        if payload.get("type") != "refresh":
            raise invalid_token_error

        # FIX #8: Guard UUID parsing — malformed sub → 401, not 500
        user_id_str: str = payload.get("sub", "")
        try:
            user_uuid = UUID(user_id_str)
        except ValueError:
            raise invalid_token_error

        # Check blacklist (covers already-rotated or logged-out refresh tokens)
        old_jti: str = payload.get("jti", "")
        if old_jti and await token_blacklist.is_blacklisted(old_jti):
            raise invalid_token_error

        # Load user
        user = await user_repository.get(db, id=user_uuid)
        if not user or not user.is_active:
            raise invalid_token_error

        # FIX #27: Rotate — blacklist the used refresh token
        if old_jti:
            _, remaining_ttl = extract_jti_and_remaining_ttl(refresh_token)
            await token_blacklist.add(old_jti, remaining_ttl)

        # Issue new token pair
        new_access_token = create_access_token(subject=str(user.id))
        new_refresh_token = create_refresh_token(subject=str(user.id))

        logger.info(f"Token refreshed for user {user.id} (old jti rotated: {old_jti})")
        return AccessTokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
        )

    # ── Logout ─────────────────────────────────────────────────

    async def logout(self, *, access_token: str) -> None:
        """
        FIX #4 (HIGH): Server-side logout via token blacklisting.

        Extracts the jti from the access token and adds it to the blacklist
        with a TTL equal to the token's remaining lifetime. On the next request
        with this token, deps.py will find it in the blacklist and return 401.

        This is a best-effort operation — if jti extraction fails, we still
        return success to the client (they should delete their tokens regardless).
        """
        jti, remaining_ttl = extract_jti_and_remaining_ttl(access_token)
        if jti and remaining_ttl > 0:
            await token_blacklist.add(jti, remaining_ttl)
            logger.info(f"Token blacklisted on logout: jti={jti}, ttl={remaining_ttl}s")

    # ── Email Verification & Password Reset ─────────────────────
    
    async def verify_email(self, db: AsyncSession, *, token: str) -> None:
        user = await user_repository.get_by_verification_token(db, token=token)
        if not user:
            raise HTTPException(status_code=400, detail="Invalid verification token.")
        
        if user.verification_token_expires and user.verification_token_expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Verification token expired.")
        
        await user_repository.update(
            db, 
            db_obj=user, 
            obj_in={"is_verified": True, "verification_token": None, "verification_token_expires": None}
        )
        logger.info(f"User email verified: {user.id}")

    async def resend_verification(self, db: AsyncSession, *, email: str) -> None:
        user = await user_repository.get_by_email(db, email=email)
        if not user:
            # Silently return to prevent email enumeration
            return
            
        if user.is_verified:
            raise HTTPException(status_code=400, detail="Email is already verified.")
            
        new_token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=24)
        
        await user_repository.update(
            db, 
            db_obj=user, 
            obj_in={"verification_token": new_token, "verification_token_expires": expires}
        )
        await email_service.send_verification_email(user.email, new_token)
        logger.info(f"Resent verification email for user {user.id}")

    async def request_password_reset(self, db: AsyncSession, *, email: str) -> None:
        user = await user_repository.get_by_email(db, email=email)
        if not user:
            return
            
        reset_token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(minutes=30)
        
        await user_repository.update(
            db, 
            db_obj=user, 
            obj_in={"reset_token": reset_token, "reset_token_expires": expires}
        )
        await email_service.send_password_reset_email(user.email, reset_token)
        logger.info(f"Password reset requested for user {user.id}")

    async def reset_password(self, db: AsyncSession, *, token: str, new_password: str) -> None:
        user = await user_repository.get_by_reset_token(db, token=token)
        if not user:
            raise HTTPException(status_code=400, detail="Invalid reset token.")
            
        if user.reset_token_expires and user.reset_token_expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Reset token expired.")
            
        hashed = hash_password(new_password)
        await user_repository.update(
            db,
            db_obj=user,
            obj_in={"hashed_password": hashed, "reset_token": None, "reset_token_expires": None}
        )
        logger.info(f"Password reset completed for user {user.id}")

    # ── Password Change ────────────────────────────────────────

    async def change_password(
        self,
        db: AsyncSession,
        *,
        user: User,
        current_password: str,
        new_password: str,
    ) -> None:
        """
        Validate the current password and update to a new one.

        Raises:
          400 Bad Request if the current password is wrong.
          400 Bad Request if the new password is the same as the current.
        """
        if not user.hashed_password or not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        if verify_password(new_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from the current password.",
            )

        new_hash = hash_password(new_password)
        await user_repository.set_password(db, user=user, hashed_password=new_hash)
        logger.info(f"Password changed for user {user.id}")

    # ── Two-Factor Authentication (TOTP) ───────────────────────

    async def setup_2fa(self, db: AsyncSession, *, user: User) -> TwoFactorSetupResponse:
        """
        Generate a new TOTP secret, persist it on the user, and return a QR code.

        Phase 1.5: Called by POST /auth/2fa/setup.

        IMPORTANT: 2FA is NOT enabled after this call.
        two_factor_enabled remains False until the user calls POST /auth/2fa/enable
        with a valid OTP, proving they have successfully scanned the QR code.

        Returns:
            TwoFactorSetupResponse with the raw base32 secret (for manual entry)
            and a base64 PNG data URI of the QR code (for in-app display).
        """
        secret = generate_totp_secret()
        await user_repository.set_2fa_secret(db, user=user, secret=secret)

        uri = get_totp_uri(secret, user.email)
        qr_code_uri = generate_qr_code_base64(uri)

        logger.info(f"2FA setup initiated for user {user.id}")
        return TwoFactorSetupResponse(secret=secret, qr_code_uri=qr_code_uri)

    async def enable_2fa(self, db: AsyncSession, *, user: User, otp_code: str) -> None:
        """
        Enable 2FA for a user after verifying their first OTP code.

        Phase 1.5: Called by POST /auth/2fa/enable.

        The user must have called /2fa/setup first (so two_factor_secret is set).
        This endpoint verifies the OTP and, if valid, sets two_factor_enabled=True.

        Raises:
            400 Bad Request if 2FA setup has not been initiated.
            400 Bad Request if the OTP code is invalid.
        """
        if not user.two_factor_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA setup not initiated. Call POST /auth/2fa/setup first.",
            )

        if not verify_totp(user.two_factor_secret, otp_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP code. Please check your authenticator app and try again.",
            )

        await user_repository.set_2fa_enabled(db, user=user, enabled=True)
        logger.info(f"2FA enabled for user {user.id}")

    async def disable_2fa(self, db: AsyncSession, *, user: User, otp_code: str) -> None:
        """
        Disable 2FA for a user after verifying their OTP code.

        Phase 1.5: Called by POST /auth/2fa/disable.

        Requires a valid OTP to prevent an attacker with a stolen session token
        from disabling 2FA without physical access to the device.
        On success, clears both two_factor_enabled and two_factor_secret.

        Raises:
            400 Bad Request if 2FA is not currently enabled.
            400 Bad Request if the OTP code is invalid.
        """
        if not user.two_factor_enabled or not user.two_factor_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is not currently enabled on this account.",
            )

        if not verify_totp(user.two_factor_secret, otp_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP code. Please check your authenticator app and try again.",
            )

        await user_repository.set_2fa_enabled(db, user=user, enabled=False)
        logger.info(f"2FA disabled for user {user.id}")

    async def complete_login_2fa(
        self, db: AsyncSession, *, pre_auth_token: str, otp_code: str
    ) -> TokenResponse:
        """
        Complete the 2FA login step: validate the pre_auth_token + OTP and issue full tokens.

        Phase 1.5: Called by POST /auth/2fa/login.

        Flow:
          1. Decode and validate the pre_auth_token (type must be "pre_auth")
          2. Load the user
          3. Verify the OTP against their stored secret
          4. Issue full access + refresh token pair

        Raises:
            401 Unauthorized if the pre_auth_token is invalid/expired.
            401 Unauthorized if the OTP code is invalid.
        """
        invalid_pre_auth = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = decode_token(pre_auth_token)
        except (InvalidTokenError, PyJWTError):
            raise invalid_pre_auth

        if payload.get("type") != "pre_auth":
            raise invalid_pre_auth

        user_id_str: str = payload.get("sub", "")
        try:
            user_uuid = UUID(user_id_str)
        except ValueError:
            raise invalid_pre_auth

        user = await user_repository.get(db, id=user_uuid)
        if not user or not user.is_active:
            raise invalid_pre_auth

        if not user.two_factor_enabled or not user.two_factor_secret:
            raise invalid_pre_auth

        if not verify_totp(user.two_factor_secret, otp_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OTP code.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        logger.info(f"2FA login complete for user {user.id}")
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    # ── Google OAuth ───────────────────────────────────────────

    async def authenticate_with_google(
        self, db: AsyncSession, *, code: str, redirect_uri: str
    ) -> TokenResponse:
        """
        Exchange Google authorization code for user info, then
        find-or-create a user account and issue JWT tokens.

        FIX #9 (HIGH): profile["id"] and profile["email"] now use .get()
                        with explicit None checks. Missing fields return 502
                        (Bad Gateway — the problem is with Google's response,
                        not the client's request) instead of KeyError → 500.

        Raises:
          401 Unauthorized if Google token exchange fails.
          502 Bad Gateway if Google's profile response is missing required fields.
          403 Forbidden if the account is deactivated.
        """
        google_tokens = await self._exchange_google_code(code, redirect_uri)
        profile = await self._fetch_google_profile(google_tokens["access_token"])

        # FIX #9: Use .get() and validate — never direct [] access on external API data
        google_id: str | None = profile.get("id")
        email: str | None = profile.get("email")

        if not google_id or not email:
            logger.error(f"Google profile missing required fields: {list(profile.keys())}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Google returned an incomplete user profile. Please try again.",
            )

        email = email.lower().strip()
        full_name: str = profile.get("name", email.split("@")[0])
        avatar_url: str | None = profile.get("picture")

        # Look up by google_id first, then email (handles account linking)
        user = await user_repository.get_by_google_id(db, google_id=google_id)
        if not user:
            user = await user_repository.get_by_email(db, email=email)

        if not user:
            user_data = {
                "email": email,
                "full_name": full_name,
                "hashed_password": None,
                "google_id": google_id,
                "avatar_url": avatar_url,
                "is_active": True,
                "is_verified": True,   # Google emails are pre-verified
                "is_superuser": False,
            }
            user = await user_repository.create_from_dict(db, obj_in=user_data)
            logger.info(f"New user via Google OAuth: {user.email} ({user.id})")
        else:
            # Link google_id to an existing password-auth account
            if not user.google_id:
                await user_repository.update(
                    db,
                    db_obj=user,
                    obj_in={"google_id": google_id, "avatar_url": avatar_url},
                )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated.",
            )

        return TokenResponse(
            access_token=create_access_token(subject=str(user.id)),
            refresh_token=create_refresh_token(subject=str(user.id)),
        )

    # ── Private Helpers ────────────────────────────────────────

    async def _exchange_google_code(self, code: str, redirect_uri: str) -> dict:
        """Exchange the Google authorization code for access tokens."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
        if resp.status_code != 200:
            logger.warning(f"Google token exchange failed: {resp.status_code} {resp.text}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to exchange Google authorization code.",
            )
        return resp.json()

    async def _fetch_google_profile(self, access_token: str) -> dict:
        """Fetch the authenticated user's Google profile."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v1/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            logger.warning(f"Google profile fetch failed: {resp.status_code}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to fetch Google user profile.",
            )
        return resp.json()


# ── Singleton instance — import this into routes ───────────────
auth_service = AuthService()
