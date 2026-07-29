"""
Tests — Auth Endpoints

Integration tests for the full auth request flow:
  POST /api/v1/auth/register
  POST /api/v1/auth/login
  POST /api/v1/auth/refresh
  GET  /api/v1/auth/me

Each test exercises the complete:
  Route → Service → Repository → DB chain
"""

import pytest
from httpx import AsyncClient


class TestRegister:
    BASE_URL = "/api/v1/auth"

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        """New user registration returns 201 with user profile."""
        resp = await client.post(
            f"{self.BASE_URL}/register",
            json={
                "email": "alice@example.com",
                "full_name": "Alice Smith",
                "password": "Secure@123",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "alice@example.com"
        assert data["full_name"] == "Alice Smith"
        assert "hashed_password" not in data   # Never expose the hash

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        """Registering with an existing email returns 409 Conflict."""
        payload = {
            "email": "bob@example.com",
            "full_name": "Bob Jones",
            "password": "Secure@123",
        }
        await client.post(f"{self.BASE_URL}/register", json=payload)
        resp = await client.post(f"{self.BASE_URL}/register", json=payload)
        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client: AsyncClient):
        """Weak password fails Pydantic validation with 422."""
        resp = await client.post(
            f"{self.BASE_URL}/register",
            json={
                "email": "carol@example.com",
                "full_name": "Carol White",
                "password": "weakpass",    # No uppercase, no digit, no special char
            },
        )
        assert resp.status_code == 422


class TestLogin:
    BASE_URL = "/api/v1/auth"

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        """Valid credentials return access + refresh tokens."""
        # Register first
        await client.post(
            f"{self.BASE_URL}/register",
            json={
                "email": "dave@example.com",
                "full_name": "Dave Clark",
                "password": "Secure@123",
            },
        )
        # Then login
        resp = await client.post(
            f"{self.BASE_URL}/login",
            json={"email": "dave@example.com", "password": "Secure@123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        """Wrong password returns 401 Unauthorized."""
        await client.post(
            f"{self.BASE_URL}/register",
            json={
                "email": "eve@example.com",
                "full_name": "Eve Brown",
                "password": "Secure@123",
            },
        )
        resp = await client.post(
            f"{self.BASE_URL}/login",
            json={"email": "eve@example.com", "password": "WrongPass!1"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_login_unknown_email(self, client: AsyncClient):
        """Unknown email returns 401 Unauthorized (no user enumeration)."""
        resp = await client.post(
            f"{self.BASE_URL}/login",
            json={"email": "ghost@example.com", "password": "Secure@123"},
        )
        assert resp.status_code == 401


class TestGetMe:
    BASE_URL = "/api/v1/auth"

    @pytest.mark.asyncio
    async def test_get_me_authenticated(self, client: AsyncClient):
        """Authenticated user gets their profile from GET /auth/me."""
        # Register + login
        await client.post(
            f"{self.BASE_URL}/register",
            json={
                "email": "frank@example.com",
                "full_name": "Frank Lee",
                "password": "Secure@123",
            },
        )
        login_resp = await client.post(
            f"{self.BASE_URL}/login",
            json={"email": "frank@example.com", "password": "Secure@123"},
        )
        token = login_resp.json()["access_token"]

        # Call /me with token
        resp = await client.get(
            f"{self.BASE_URL}/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "frank@example.com"

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Without token, GET /auth/me returns 401."""
        resp = await client.get(f"{self.BASE_URL}/me")
        assert resp.status_code == 401


class TestRefreshToken:
    BASE_URL = "/api/v1/auth"

    @pytest.mark.asyncio
    async def test_refresh_success(self, client: AsyncClient):
        # Register + login
        await client.post(
            f"{self.BASE_URL}/register",
            json={
                "email": "refresh@example.com",
                "full_name": "Refresh User",
                "password": "Secure@123",
            },
        )
        login_resp = await client.post(
            f"{self.BASE_URL}/login",
            json={"email": "refresh@example.com", "password": "Secure@123"},
        )
        refresh_token = login_resp.json()["refresh_token"]

        resp = await client.post(
            f"{self.BASE_URL}/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_refresh_invalid_token(self, client: AsyncClient):
        resp = await client.post(
            f"{self.BASE_URL}/refresh",
            json={"refresh_token": "invalid_token_string"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_expired_token(self, client: AsyncClient):
        # Create an expired token manually for testing
        from app.core.config import settings
        from datetime import datetime, timedelta, timezone
        import jwt

        expired_payload = {
            "sub": "00000000-0000-0000-0000-000000000000",
            "exp": datetime.now(timezone.utc) - timedelta(days=1),
            "iat": datetime.now(timezone.utc) - timedelta(days=2),
            "jti": "test-jti",
            "type": "refresh"
        }
        expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        resp = await client.post(
            f"{self.BASE_URL}/refresh",
            json={"refresh_token": expired_token},
        )
        assert resp.status_code == 401


class TestLogout:
    BASE_URL = "/api/v1/auth"

    @pytest.mark.asyncio
    async def test_logout_invalidates_token(self, client: AsyncClient):
        # Register + login
        await client.post(
            f"{self.BASE_URL}/register",
            json={
                "email": "logout@example.com",
                "full_name": "Logout User",
                "password": "Secure@123",
            },
        )
        login_resp = await client.post(
            f"{self.BASE_URL}/login",
            json={"email": "logout@example.com", "password": "Secure@123"},
        )
        token = login_resp.json()["access_token"]

        # 1. Access protected route successfully
        resp1 = await client.get(
            f"{self.BASE_URL}/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp1.status_code == 200

        # 2. Logout
        logout_resp = await client.post(
            f"{self.BASE_URL}/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert logout_resp.status_code == 200

        # 3. Access protected route again - should fail
        resp2 = await client.get(
            f"{self.BASE_URL}/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp2.status_code == 401
