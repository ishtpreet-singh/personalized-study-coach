"""
Tests — Security utilities

Unit tests for password hashing, JWT generation, and token validation.
"""

import pytest
from datetime import datetime, timedelta, timezone
import jwt
from jwt.exceptions import InvalidTokenError

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)

def test_password_hashing():
    """Test that hashing creates a valid, verifiable hash."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    
    assert hashed != password
    assert isinstance(hashed, str)
    assert len(hashed) > 20  # bcrypt hashes are 60 chars

def test_password_verification():
    """Test that correct passwords pass and incorrect fail."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_creation_and_validation():
    """Test creating and decoding a valid JWT."""
    subject = "12345-abcde"
    token = create_access_token(subject)
    
    payload = decode_token(token)
    assert payload["sub"] == subject
    assert payload["type"] == "access"
    assert "exp" in payload
    assert "iat" in payload
    assert "jti" in payload

def test_jwt_expired_token():
    """Test that an expired token raises an exception."""
    subject = "12345-abcde"
    # Create token that expired 1 minute ago
    token = create_access_token(subject, expires_delta=timedelta(minutes=-1))
    
    with pytest.raises(InvalidTokenError):
        decode_token(token)

def test_jwt_tampered_token():
    """Test that modifying a token payload invalidates the signature."""
    subject = "12345-abcde"
    token = create_access_token(subject)
    
    # Split the JWT, modify payload, and reassemble
    header, payload, signature = token.split(".")
    import base64
    import json
    
    # Add padding for base64 decoding
    payload_padded = payload + "=" * ((4 - len(payload) % 4) % 4)
    decoded_payload = json.loads(base64.urlsafe_b64decode(payload_padded).decode())
    
    # Tamper with the subject
    decoded_payload["sub"] = "hacked-user-id"
    
    # Re-encode payload
    tampered_payload = base64.urlsafe_b64encode(json.dumps(decoded_payload).encode()).decode().rstrip("=")
    tampered_token = f"{header}.{tampered_payload}.{signature}"
    
    with pytest.raises(InvalidTokenError):
        decode_token(tampered_token)

def test_jwt_wrong_type():
    """Test distinction between access and refresh tokens."""
    subject = "12345-abcde"
    access_token = create_access_token(subject)
    refresh_token = create_refresh_token(subject)
    
    access_payload = decode_token(access_token)
    refresh_payload = decode_token(refresh_token)
    
    assert access_payload["type"] == "access"
    assert refresh_payload["type"] == "refresh"
