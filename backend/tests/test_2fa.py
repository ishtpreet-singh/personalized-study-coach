"""
Tests — Phase 1.5 Two-Factor Authentication (TOTP)

Covers:
  1. TOTP utility functions (secret generation, QR code, verification)
  2. POST /api/v1/auth/2fa/setup
  3. POST /api/v1/auth/2fa/enable
  4. POST /api/v1/auth/2fa/disable
  5. POST /api/v1/auth/login (without 2FA — existing behaviour unchanged)
  6. POST /api/v1/auth/login (with 2FA — returns pre_auth_token)
  7. POST /api/v1/auth/2fa/login (complete 2FA login with valid OTP)
  8. POST /api/v1/auth/2fa/login (complete 2FA login with wrong OTP)
"""

import pyotp
import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.core.totp import (
    generate_totp_secret,
    generate_qr_code_base64,
    get_totp_uri,
    verify_totp,
)


# ── Fixtures ──────────────────────────────────────────────────────────

VALID_USER = {
    "email": "2fatest@example.com",
    "full_name": "Two FA User",
    "password": "SecurePass1!",
}


async def _register_and_login(client: AsyncClient) -> dict:
    """Helper: register a user and return their auth headers."""
    await client.post("/api/v1/auth/register", json=VALID_USER)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ── TOTP Utility Tests ─────────────────────────────────────────────────

def test_totp_secret_generation():
    """Generated secret must be a valid base32 string."""
    secret = generate_totp_secret()
    assert isinstance(secret, str)
    assert len(secret) >= 16  # pyotp generates 32 chars
    # Valid base32: only A-Z and 2-7
    import re
    assert re.match(r"^[A-Z2-7]+=*$", secret), "Secret must be valid base32"


def test_totp_verify_valid_code():
    """verify_totp must accept a code generated from the same secret."""
    secret = generate_totp_secret()
    code = pyotp.TOTP(secret).now()
    assert verify_totp(secret, code) is True


def test_totp_verify_invalid_code():
    """verify_totp must reject all-zeros and other wrong codes."""
    secret = generate_totp_secret()
    assert verify_totp(secret, "000000") is False
    assert verify_totp(secret, "123456") is False


def test_totp_verify_code_with_spaces():
    """verify_totp must strip spaces from user-entered codes."""
    secret = generate_totp_secret()
    code = pyotp.TOTP(secret).now()
    code_with_spaces = code[:3] + " " + code[3:]
    assert verify_totp(secret, code_with_spaces) is True


def test_get_totp_uri():
    """get_totp_uri must produce a valid otpauth:// URI."""
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, "user@example.com")
    assert uri.startswith("otpauth://totp/")
    assert "user%40example.com" in uri or "user@example.com" in uri
    assert secret in uri


def test_generate_qr_code_base64():
    """generate_qr_code_base64 must return a valid PNG data URI."""
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, "user@example.com")
    qr = generate_qr_code_base64(uri)
    assert qr.startswith("data:image/png;base64,")
    assert len(qr) > 100  # Should be a non-trivial image


# ── API Tests ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_without_2fa(client: AsyncClient):
    """Login should return full tokens for users without 2FA enabled."""
    await client.post("/api/v1/auth/register", json=VALID_USER)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data.get("requires_2fa", False) is False


@pytest.mark.asyncio
async def test_2fa_setup_endpoint(client: AsyncClient):
    """POST /auth/2fa/setup must return a secret and a QR code URI."""
    headers = await _register_and_login(client)
    resp = await client.post("/api/v1/auth/2fa/setup", headers=headers)

    assert resp.status_code == 200
    data = resp.json()
    assert "secret" in data
    assert "qr_code_uri" in data
    assert data["qr_code_uri"].startswith("data:image/png;base64,")
    assert len(data["secret"]) >= 16


@pytest.mark.asyncio
async def test_2fa_setup_requires_auth(client: AsyncClient):
    """POST /auth/2fa/setup must reject unauthenticated requests."""
    resp = await client.post("/api/v1/auth/2fa/setup")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_2fa_enable_with_valid_otp(client: AsyncClient):
    """POST /auth/2fa/enable with a valid OTP should enable 2FA."""
    headers = await _register_and_login(client)

    # Setup
    setup_resp = await client.post("/api/v1/auth/2fa/setup", headers=headers)
    secret = setup_resp.json()["secret"]

    # Enable with valid OTP
    otp_code = pyotp.TOTP(secret).now()
    enable_resp = await client.post(
        "/api/v1/auth/2fa/enable",
        json={"otp_code": otp_code},
        headers=headers,
    )
    assert enable_resp.status_code == 200
    assert "enabled" in enable_resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_2fa_enable_with_wrong_otp(client: AsyncClient):
    """POST /auth/2fa/enable with a wrong OTP must return 400."""
    headers = await _register_and_login(client)
    await client.post("/api/v1/auth/2fa/setup", headers=headers)

    enable_resp = await client.post(
        "/api/v1/auth/2fa/enable",
        json={"otp_code": "000000"},
        headers=headers,
    )
    assert enable_resp.status_code == 400


@pytest.mark.asyncio
async def test_2fa_enable_without_setup(client: AsyncClient):
    """POST /auth/2fa/enable without calling setup first must return 400."""
    headers = await _register_and_login(client)
    resp = await client.post(
        "/api/v1/auth/2fa/enable",
        json={"otp_code": "123456"},
        headers=headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_login_with_2fa_requires_otp(client: AsyncClient):
    """Login with 2FA enabled must return requires_2fa=True and a pre_auth_token."""
    headers = await _register_and_login(client)

    # Enable 2FA
    setup_resp = await client.post("/api/v1/auth/2fa/setup", headers=headers)
    secret = setup_resp.json()["secret"]
    otp = pyotp.TOTP(secret).now()
    await client.post("/api/v1/auth/2fa/enable", json={"otp_code": otp}, headers=headers)

    # Login should now return pre_auth step
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert data["requires_2fa"] is True
    assert "pre_auth_token" in data
    assert "access_token" not in data


@pytest.mark.asyncio
async def test_2fa_login_complete_with_valid_otp(client: AsyncClient):
    """POST /auth/2fa/login with valid pre_auth_token + OTP must return full tokens."""
    headers = await _register_and_login(client)

    # Enable 2FA
    setup_resp = await client.post("/api/v1/auth/2fa/setup", headers=headers)
    secret = setup_resp.json()["secret"]
    otp = pyotp.TOTP(secret).now()
    await client.post("/api/v1/auth/2fa/enable", json={"otp_code": otp}, headers=headers)

    # Login step 1: get pre_auth_token
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    pre_auth_token = login_resp.json()["pre_auth_token"]

    # Login step 2: complete with OTP
    complete_resp = await client.post(
        "/api/v1/auth/2fa/login",
        json={"pre_auth_token": pre_auth_token, "otp_code": pyotp.TOTP(secret).now()},
    )
    assert complete_resp.status_code == 200
    data = complete_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_2fa_login_complete_with_wrong_otp(client: AsyncClient):
    """POST /auth/2fa/login with a wrong OTP must return 401."""
    headers = await _register_and_login(client)

    # Enable 2FA
    setup_resp = await client.post("/api/v1/auth/2fa/setup", headers=headers)
    secret = setup_resp.json()["secret"]
    otp = pyotp.TOTP(secret).now()
    await client.post("/api/v1/auth/2fa/enable", json={"otp_code": otp}, headers=headers)

    # Login step 1
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    pre_auth_token = login_resp.json()["pre_auth_token"]

    # Login step 2: wrong OTP
    complete_resp = await client.post(
        "/api/v1/auth/2fa/login",
        json={"pre_auth_token": pre_auth_token, "otp_code": "000000"},
    )
    assert complete_resp.status_code == 401


@pytest.mark.asyncio
async def test_2fa_disable_with_valid_otp(client: AsyncClient):
    """POST /auth/2fa/disable with valid OTP must disable 2FA and restore single-step login."""
    headers = await _register_and_login(client)

    # Enable 2FA
    setup_resp = await client.post("/api/v1/auth/2fa/setup", headers=headers)
    secret = setup_resp.json()["secret"]
    otp = pyotp.TOTP(secret).now()
    await client.post("/api/v1/auth/2fa/enable", json={"otp_code": otp}, headers=headers)

    # Disable 2FA
    disable_resp = await client.post(
        "/api/v1/auth/2fa/disable",
        json={"otp_code": pyotp.TOTP(secret).now()},
        headers=headers,
    )
    assert disable_resp.status_code == 200

    # Login should now return full tokens (no 2FA step)
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert data.get("requires_2fa", False) is False


@pytest.mark.asyncio
async def test_2fa_disable_with_wrong_otp(client: AsyncClient):
    """POST /auth/2fa/disable with wrong OTP must return 400."""
    headers = await _register_and_login(client)

    # Enable 2FA
    setup_resp = await client.post("/api/v1/auth/2fa/setup", headers=headers)
    secret = setup_resp.json()["secret"]
    otp = pyotp.TOTP(secret).now()
    await client.post("/api/v1/auth/2fa/enable", json={"otp_code": otp}, headers=headers)

    # Attempt disable with wrong OTP
    disable_resp = await client.post(
        "/api/v1/auth/2fa/disable",
        json={"otp_code": "000000"},
        headers=headers,
    )
    assert disable_resp.status_code == 400
