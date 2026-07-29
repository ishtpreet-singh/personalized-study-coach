"""
Auth Routes — POST /api/v1/auth/...

This module is the HTTP boundary layer ONLY.
It handles:
  - HTTP request parsing (input validation via Pydantic schemas)
  - Calling the appropriate AuthService method
  - Shaping the HTTP response

It does NOT contain:
  - Business logic (that lives in AuthService)
  - Database queries (that lives in UserRepository)
  - Password hashing (that lives in core/security.py)

Endpoints:
  POST /auth/register        → Create a new account
  POST /auth/login           → Get JWT tokens
  POST /auth/refresh         → Exchange refresh token for a new access token
  POST /auth/google          → Google OAuth2 sign-in
  POST /auth/password/change → Change password for authenticated user
  POST /auth/logout          → Client-side logout (token blacklisting TBD)
  GET  /auth/me              → Get current authenticated user profile
"""

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials

from app.api.deps import CurrentUser, DBSession, bearer_scheme
from app.schemas.auth import (
    AccessTokenResponse,
    GoogleAuthRequest,
    LoginRequest,
    PasswordChangeRequest,
    PreAuthTokenResponse,
    RefreshRequest,
    TokenResponse,
    TwoFactorDisableRequest,
    TwoFactorLoginRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
)
from app.schemas.auth import (
    ResendVerificationRequest,
    ResetPasswordRequest,
    ResetPassword,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── POST /auth/register ────────────────────────────────────────
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    user_in: UserCreate,
    db: DBSession,
) -> UserResponse:
    """
    Create a new user account with email and password.

    - Email must be unique.
    - Password must be at least 8 characters with uppercase, digit, and special char.
    - Returns the created user profile (no password in response).
    """
    user = await auth_service.register(db, user_in=user_in)
    return UserResponse.model_validate(user)


# ── POST /auth/login ──────────────────────────────────────────────────
@router.post(
    "/login",
    response_model=TokenResponse | PreAuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with email and password",
)
async def login(
    credentials: LoginRequest,
    db: DBSession,
) -> TokenResponse | PreAuthTokenResponse:
    """
    Authenticate with email and password.

    Returns a JWT access token (short-lived) and a refresh token (long-lived).
    Use the access token in the `Authorization: Bearer <token>` header.
    """
    return await auth_service.login(
        db, email=credentials.email, password=credentials.password
    )


# ── POST /auth/refresh ─────────────────────────────────────────
@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
)
async def refresh_token(
    body: RefreshRequest,
    db: DBSession,
) -> AccessTokenResponse:
    """
    Exchange a valid refresh token for a new access token.

    Use this when your access token expires (default: 60 minutes).
    """
    return await auth_service.refresh_access_token(
        db, refresh_token=body.refresh_token
    )


# ── GET /auth/me ───────────────────────────────────────────────
@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
)
async def get_me(current_user: CurrentUser) -> UserResponse:
    """
    Return the profile of the currently authenticated user.
    Requires a valid Bearer access token.
    """
    return UserResponse.model_validate(current_user)


# ── POST /auth/password/change ─────────────────────────────────
@router.post(
    "/password/change",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Change password for authenticated user",
)
async def change_password(
    body: PasswordChangeRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> MessageResponse:
    """
    Change the password for the currently authenticated user.

    Requires the current password to be provided for verification.
    """
    await auth_service.change_password(
        db,
        user=current_user,
        current_password=body.current_password,
        new_password=body.new_password,
    )
    return MessageResponse(message="Password updated successfully.")


# ── POST /auth/google ──────────────────────────────────────────
@router.post(
    "/google",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate with Google OAuth2",
)
async def google_auth(
    body: GoogleAuthRequest,
    db: DBSession,
) -> TokenResponse:
    """
    Exchange a Google OAuth2 authorization code for JWT tokens.

    The frontend should redirect the user to Google's consent screen,
    then send the received `code` and `redirect_uri` here.
    """
    return await auth_service.authenticate_with_google(
        db, code=body.code, redirect_uri=body.redirect_uri
    )


# ── POST /auth/logout ──────────────────────────────────────────────────
@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout (server-side)",
)
async def logout(
    current_user: CurrentUser,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> MessageResponse:
    """
    Logout the current user.

    Invalidates the current access token by adding its JTI to the token blacklist.
    """
    if credentials:
        await auth_service.logout(access_token=credentials.credentials)
    
    return MessageResponse(
        message="Logged out successfully. Token has been invalidated."
    )


# ── Email Verification & Password Reset ─────────────────────────────────

@router.get(
    "/verify-email",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify email address",
)
async def verify_email(token: str, db: DBSession) -> MessageResponse:
    await auth_service.verify_email(db, token=token)
    return MessageResponse(message="Email successfully verified.")

@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Resend verification email",
)
async def resend_verification(body: ResendVerificationRequest, db: DBSession) -> MessageResponse:
    await auth_service.resend_verification(db, email=body.email)
    return MessageResponse(message="Verification email sent if account exists.")

@router.post(
    "/reset-password-request",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a password reset email",
)
async def request_password_reset(body: ResetPasswordRequest, db: DBSession) -> MessageResponse:
    await auth_service.request_password_reset(db, email=body.email)
    return MessageResponse(message="Password reset email sent if account exists.")

@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password using a token",
)
async def reset_password(body: ResetPassword, db: DBSession) -> MessageResponse:
    await auth_service.reset_password(db, token=body.token, new_password=body.new_password)
    return MessageResponse(message="Password successfully reset.")


# ──────────────────────────────────────────────────────────────────────
# Phase 1.5 — Two-Factor Authentication (TOTP)
# ──────────────────────────────────────────────────────────────────────


@router.post(
    "/2fa/setup",
    response_model=TwoFactorSetupResponse,
    status_code=status.HTTP_200_OK,
    summary="Initiate 2FA setup — generate secret and QR code",
)
async def setup_2fa(
    current_user: CurrentUser,
    db: DBSession,
) -> TwoFactorSetupResponse:
    """
    Generate a TOTP secret and return a QR code for the authenticated user to scan.

    2FA is NOT yet enabled after this call.
    The user must call POST /auth/2fa/enable with a valid OTP to activate it.
    """
    return await auth_service.setup_2fa(db, user=current_user)


@router.post(
    "/2fa/enable",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Enable 2FA after scanning QR code",
)
async def enable_2fa(
    body: TwoFactorVerifyRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> MessageResponse:
    """
    Verify the first OTP code and activate 2FA on the account.

    Requires the user to have called POST /auth/2fa/setup first.
    """
    await auth_service.enable_2fa(db, user=current_user, otp_code=body.otp_code)
    return MessageResponse(message="Two-factor authentication has been enabled.")


@router.post(
    "/2fa/disable",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Disable 2FA (requires OTP confirmation)",
)
async def disable_2fa(
    body: TwoFactorDisableRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> MessageResponse:
    """
    Disable 2FA on the account after verifying the current OTP.

    Requires a valid OTP to prevent session-hijacking attacks from
    disabling 2FA without physical access to the authenticator device.
    """
    await auth_service.disable_2fa(db, user=current_user, otp_code=body.otp_code)
    return MessageResponse(message="Two-factor authentication has been disabled.")


@router.post(
    "/2fa/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete 2FA login — exchange pre_auth_token + OTP for full JWT",
)
async def login_2fa(
    body: TwoFactorLoginRequest,
    db: DBSession,
) -> TokenResponse:
    """
    Second step of 2FA login.

    Submit the pre_auth_token received from POST /auth/login together with
    the 6-digit OTP from the authenticator app. Returns full access + refresh tokens.
    """
    return await auth_service.complete_login_2fa(
        db,
        pre_auth_token=body.pre_auth_token,
        otp_code=body.otp_code,
    )
