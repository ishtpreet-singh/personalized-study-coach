"""
FastAPI Dependency Injection

FIX #8  (HIGH):   UUID(user_id) now wrapped in try/except ValueError.
                   Malformed 'sub' claim (empty string, non-UUID) used to
                   raise ValueError which became a 500. Now returns 401.

FIX #4  (HIGH):   Token blacklist check added to get_current_user.
                   Blacklisted tokens (logged-out) are rejected with 401
                   instead of being silently accepted for their remaining TTL.

FIX #1  (CRITICAL): Updated exception imports from jose → jwt.exceptions.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError, PyJWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.core.token_blacklist import token_blacklist
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import user_repository

# ── Bearer Token Extractor ────────────────────────────────────
# HTTPBearer reads the Authorization header and extracts the token string.
# auto_error=False lets us return a clean 401 instead of FastAPI's 403.
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency: Decode JWT access token and return the authenticated User.

    FIX #8: UUID parsing is now guarded — ValueError → 401 not 500.
    FIX #4: Blacklisted tokens (logged-out sessions) are rejected here.

    Raises:
      401 Unauthorized if:
        - No Authorization header is present
        - Token is malformed, expired, or has invalid signature
        - Token type is not "access"
        - Token's jti is in the blacklist (user has logged out)
        - Token's sub is not a valid UUID
        - User no longer exists in the database
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception

    # Decode and verify JWT signature/expiry
    try:
        payload = decode_token(credentials.credentials)
    except (InvalidTokenError, PyJWTError):
        raise credentials_exception

    # Enforce token type — prevent refresh tokens being used as access tokens
    if payload.get("type") != "access":
        raise credentials_exception

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    # FIX #8: Guard UUID parsing — malformed sub → 401, not ValueError → 500
    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    # FIX #4: Check token blacklist — reject blacklisted (logged-out) tokens
    jti: str | None = payload.get("jti")
    if jti and await token_blacklist.is_blacklisted(jti):
        raise credentials_exception

    # Load user from database
    user = await user_repository.get(db, id=user_uuid)
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Dependency: Like get_current_user but additionally enforces is_active=True.
    Use this for all standard protected endpoints.

    Raises:
      403 Forbidden if the user account has been deactivated.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )
    return current_user


async def get_current_superuser(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """
    Dependency: Restricts access to superusers only (admin endpoints).

    Raises:
      403 Forbidden if the user is not a superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )
    return current_user


# ── Type aliases for cleaner route signatures ──────────────────
CurrentUser = Annotated[User, Depends(get_current_active_user)]
SuperUser = Annotated[User, Depends(get_current_superuser)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
