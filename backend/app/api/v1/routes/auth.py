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
    RefreshRequest,
    TokenResponse,
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


# ── POST /auth/login ───────────────────────────────────────────
@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with email and password",
)
async def login(
    credentials: LoginRequest,
    db: DBSession,
) -> TokenResponse:
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


# ── POST /auth/logout ──────────────────────────────────────────
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

