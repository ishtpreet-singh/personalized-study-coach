"""
Token Blacklist Interface

FIX #4 (HIGH): Implements server-side token invalidation for proper logout.

Provides a pluggable interface with two implementations:
  - InMemoryTokenBlacklist : Development and testing (process-local, non-persistent)
  - RedisTokenBlacklist    : Production (distributed, persistent, auto-expiring)

How logout works:
  1. Client calls POST /auth/logout with valid Bearer token.
  2. Route extracts jti (unique token ID) and calculates remaining TTL.
  3. token_blacklist.add(jti, remaining_ttl) stores it with exact expiry.
  4. On every protected request, deps.py checks is_blacklisted(jti).
  5. The blacklist entry auto-expires when the token itself would have expired.

To switch to Redis for production:
  1. Set REDIS_URL in .env
  2. Replace the last line of this file:
     token_blacklist = RedisTokenBlacklist(settings.REDIS_URL)
"""

import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict

logger = logging.getLogger(__name__)


class TokenBlacklistBackend(ABC):
    """
    Abstract interface for JWT token blacklisting.

    All implementations must be:
      - Async-safe (awaitable methods)
      - Thread-safe for concurrent requests
      - Automatically expiring (entries should self-clean at token TTL)
    """

    @abstractmethod
    async def add(self, jti: str, ttl_seconds: int) -> None:
        """
        Add a JWT ID to the blacklist.

        Args:
            jti:         The unique JWT ID from the token's 'jti' claim.
            ttl_seconds: Time-to-live matching the token's remaining lifetime.
                         After this duration, the entry can be removed.
        """
        ...

    @abstractmethod
    async def is_blacklisted(self, jti: str) -> bool:
        """
        Return True if this JWT ID has been revoked.
        Returns False for unknown JTIs (not blacklisted).
        """
        ...

    @abstractmethod
    async def close(self) -> None:
        """Release any held resources (connections, handles). Called on app shutdown."""
        ...


class InMemoryTokenBlacklist(TokenBlacklistBackend):
    """
    In-memory token blacklist for development and testing.

    ⚠️  NOT suitable for production:
        - Not shared across multiple processes or server instances
        - Lost on process restart / server reboot
        - Unbounded growth under sustained logout traffic

    Replace with RedisTokenBlacklist before production deployment.
    """

    def __init__(self) -> None:
        # Maps jti → unix timestamp when the blacklist entry expires
        self._store: Dict[str, float] = {}

    async def add(self, jti: str, ttl_seconds: int) -> None:
        expire_at = datetime.now(timezone.utc).timestamp() + ttl_seconds
        self._store[jti] = expire_at
        logger.debug(f"[Blacklist:InMemory] Token blacklisted jti={jti} ttl={ttl_seconds}s")

    async def is_blacklisted(self, jti: str) -> bool:
        expire_at = self._store.get(jti)
        if expire_at is None:
            return False
        # Lazy cleanup: remove expired entries on access
        if datetime.now(timezone.utc).timestamp() > expire_at:
            del self._store[jti]
            return False
        return True

    async def close(self) -> None:
        self._store.clear()


class RedisTokenBlacklist(TokenBlacklistBackend):
    """
    Redis-backed token blacklist for production deployments.

    Each revoked JTI is stored as a Redis key with an automatic TTL.
    When the TTL expires, Redis removes the key — no cleanup job needed.
    Works correctly across multiple server instances and processes.

    Prerequisites:
      - redis==5.0.4 in requirements.txt (already added)
      - Set REDIS_URL in .env (e.g. redis://redis:6379/0)

    Activation:
      Replace the active instance at the bottom of this file:
        token_blacklist = RedisTokenBlacklist(settings.REDIS_URL)
    """

    _PREFIX = "token_blacklist:"   # Redis key namespace

    def __init__(self, redis_url: str) -> None:
        import redis.asyncio as aioredis  # deferred — optional in dev
        self._client = aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        logger.info(f"[Blacklist:Redis] Connected to {redis_url}")

    async def add(self, jti: str, ttl_seconds: int) -> None:
        if ttl_seconds <= 0:
            return  # Token already expired — no need to blacklist
        key = f"{self._PREFIX}{jti}"
        await self._client.setex(key, ttl_seconds, "1")
        logger.info(f"[Blacklist:Redis] Token blacklisted jti={jti} ttl={ttl_seconds}s")

    async def is_blacklisted(self, jti: str) -> bool:
        key = f"{self._PREFIX}{jti}"
        result = await self._client.exists(key)
        return bool(result)

    async def close(self) -> None:
        await self._client.aclose()
        logger.info("[Blacklist:Redis] Connection closed")


# ── Active Backend ─────────────────────────────────────────────
# FIX #4 (HIGH): Active blacklist implementation.
# Development/test default: InMemoryTokenBlacklist (no Redis required).
# Production: swap to RedisTokenBlacklist(settings.REDIS_URL).
token_blacklist: TokenBlacklistBackend = InMemoryTokenBlacklist()
