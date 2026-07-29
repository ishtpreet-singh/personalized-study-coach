"""
Auth Pydantic Schemas

Request and response shapes for all authentication endpoints.

FIX #10 (MEDIUM): PasswordChangeRequest.new_password now enforces the same
                   password strength rules as registration (was length-only before).
FIX #26 (LOW):    MessageResponse removed — it lives in schemas/common.py.

Phase 1.5: Added 2FA schemas for TOTP-based two-factor authentication.
"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.validators import validate_password_strength


class LoginRequest(BaseModel):
    """Credentials for email/password login."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """JWT pair returned after successful authentication (no 2FA, or 2FA already complete)."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    requires_2fa: bool = False           # Always False when this schema is returned


class PreAuthTokenResponse(BaseModel):
    """
    Returned by POST /auth/login when the user has 2FA enabled.

    The client must take the pre_auth_token and a valid OTP code and call
    POST /auth/2fa/login to receive the full access + refresh token pair.

    pre_auth_token: Short-lived JWT (5 min TTL) of type "pre_auth".
                    It only authorises the /auth/2fa/login endpoint.
    """
    requires_2fa: bool = True
    pre_auth_token: str


class AccessTokenResponse(BaseModel):
    """Single access token returned after token refresh."""
    access_token: str
    refresh_token: str   # FIX #27 (LOW): Refresh token rotation — new refresh issued on every refresh call
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Refresh token submitted to get a new access token."""
    refresh_token: str


class GoogleAuthRequest(BaseModel):
    """Authorization code from the Google OAuth2 consent screen."""
    code: str
    redirect_uri: str


class PasswordChangeRequest(BaseModel):
    """
    Request body for POST /auth/password/change.

    FIX #10 (MEDIUM): new_password now validates full strength rules —
    uppercase, digit, and special character — consistent with registration.
    """
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        """Enforce the same strength rules as registration."""
        return validate_password_strength(v)


# ── Two-Factor Authentication Schemas ──────────────────────────────────

class TwoFactorSetupResponse(BaseModel):
    """
    Returned by POST /auth/2fa/setup.

    qr_code_uri: A base64-encoded PNG data URI — embed directly as <img src=...>.
    secret:      The raw base32 secret for manual entry in authenticator apps.
    """
    secret: str
    qr_code_uri: str


class TwoFactorVerifyRequest(BaseModel):
    """Submitted to POST /auth/2fa/enable to activate 2FA after scanning the QR code."""
    otp_code: str = Field(..., min_length=6, max_length=8, description="6-digit TOTP code")


class TwoFactorDisableRequest(BaseModel):
    """Submitted to POST /auth/2fa/disable — requires OTP to confirm the user has access."""
    otp_code: str = Field(..., min_length=6, max_length=8, description="6-digit TOTP code")


class TwoFactorLoginRequest(BaseModel):
    """
    Submitted to POST /auth/2fa/login to complete the second authentication step.

    pre_auth_token: The short-lived token issued by POST /auth/login when 2FA is required.
    otp_code:       The 6-digit code from the user's authenticator app.
    """
    pre_auth_token: str
    otp_code: str = Field(..., min_length=6, max_length=8, description="6-digit TOTP code")
