"""
Auth Pydantic Schemas

Request and response shapes for all authentication endpoints.

FIX #10 (MEDIUM): PasswordChangeRequest.new_password now enforces the same
                   password strength rules as registration (was length-only before).
FIX #26 (LOW):    MessageResponse removed — it lives in schemas/common.py.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.validators import validate_password_strength


class LoginRequest(BaseModel):
    """Credentials for email/password login."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """JWT pair returned after successful authentication."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


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
