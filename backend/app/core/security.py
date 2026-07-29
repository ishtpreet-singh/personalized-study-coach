"""
Core Security Utilities

FIX #1  (CRITICAL): Migrated from unmaintained python-jose → PyJWT 2.8.0.
FIX #3  (HIGH):     Added iat (issued-at) and jti (JWT ID) claims to all tokens.
                    jti enables per-token blacklisting (server-side logout).
                    iat enables "invalidate tokens issued before X" patterns.
FIX #21 (MEDIUM):   bcrypt rounds now driven by settings.BCRYPT_ROUNDS (configurable).

Pure functions — no database access, no HTTP concerns.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

import jwt
from jwt.exceptions import InvalidTokenError, PyJWTError
import bcrypt

from app.core.config import settings

# FIX #21: bcrypt rounds are now explicitly configured via settings.BCRYPT_ROUNDS.
# This makes the work factor visible and tunable without code changes.
# Note: Using bcrypt directly instead of passlib due to passlib bug with bcrypt>=4.0.0


def hash_password(plain_password: str) -> str:
    """
    Hash a plain-text password using bcrypt.
    The resulting hash is safe to store in the database.
    Work factor: settings.BCRYPT_ROUNDS (default: 12).
    """
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(plain_password.encode('utf-8'), salt)
    return hashed.decode('ascii')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compare a plain-text password against a stored bcrypt hash.
    Returns True if they match, False otherwise.
    Timing-safe — bcrypt's checkpw uses constant-time comparison.
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('ascii'))


# ── JWT Helpers ───────────────────────────────────────────────

def create_access_token(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.

    FIX #1: Uses PyJWT instead of python-jose.
    FIX #3: Includes iat (issued-at) and jti (unique token ID) claims.

    Args:
        subject:       Typically the user's UUID (str).
        expires_delta: Custom expiry; defaults to settings.ACCESS_TOKEN_EXPIRE_MINUTES.

    Token payload:
        sub  — Subject (user UUID)
        exp  — Expiry timestamp (UTC)
        iat  — Issued-at timestamp (UTC) — enables "issued before X" checks
        jti  — Unique token ID (UUID4) — enables individual token blacklisting
        type — "access" — prevents refresh tokens being used as access tokens
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": now,
        "jti": str(uuid.uuid4()),
        "type": "access",
    }
    # PyJWT 2.x: encode() returns str directly (no .decode() needed)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str | Any) -> str:
    """
    Create a signed JWT refresh token with a longer expiry.

    FIX #1: Uses PyJWT instead of python-jose.
    FIX #3: Includes iat and jti claims.

    Token payload:
        sub  — Subject (user UUID)
        exp  — Expiry timestamp (UTC)
        iat  — Issued-at timestamp (UTC)
        jti  — Unique token ID — enables refresh token rotation/revocation
        type — "refresh" — prevents refresh tokens being used as access tokens
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": now,
        "jti": str(uuid.uuid4()),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token.

    FIX #1: Uses PyJWT instead of python-jose.

    Raises:
        PyJWTError / InvalidTokenError: if the token is expired,
        malformed, has an invalid signature, or fails any claim validation.

    Returns:
        The decoded payload dict — always contains 'sub', 'exp', 'iat', 'jti', 'type'.
    """
    try:
        payload: Dict[str, Any] = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except PyJWTError as e:
        # Re-raise as InvalidTokenError for uniform catching at call sites
        raise InvalidTokenError(f"Token validation failed: {e}") from e


def extract_jti_and_remaining_ttl(token: str) -> Tuple[Optional[str], int]:
    """
    Decode a token and extract its jti and remaining time-to-live (seconds).

    Used by the logout endpoint to blacklist the token with a precise TTL
    so the blacklist entry automatically expires at the same time as the token.

    Returns:
        (jti, remaining_ttl_seconds) — ttl is 0 if the token is already expired.
        (None, 0) if the token cannot be decoded.
    """
    try:
        payload = decode_token(token)
    except (InvalidTokenError, PyJWTError):
        return None, 0

    jti: Optional[str] = payload.get("jti")
    exp: Optional[float] = payload.get("exp")

    if not jti or exp is None:
        return None, 0

    remaining = max(0, int(exp - datetime.now(timezone.utc).timestamp()))
    return jti, remaining
