"""
User Repository

FIX #6 (HIGH): email_exists() replaced with a proper SQL EXISTS query.
               Old implementation fetched an entire user row (SELECT *) just to
               return a boolean. New implementation uses EXISTS which short-circuits
               at the first matching row and transfers no data columns over the wire.

All other methods remain a single, well-defined DB operation with no business logic.
"""

from typing import Optional

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.user import UserCreate, UserUpdate


class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    """
    Repository for the User model.

    Transaction contract:
      All methods call flush() (via BaseRepository), never commit().
      The owning request's get_db() session commits on success.
    """

    model = User

    async def get_by_email(
        self, db: AsyncSession, *, email: str
    ) -> Optional[User]:
        """
        Fetch a user by their email address.
        Email is normalized (lowercased + stripped) before querying.
        Used by AuthService during login and registration uniqueness check.
        """
        result = await db.execute(
            select(User).where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def get_by_google_id(
        self, db: AsyncSession, *, google_id: str
    ) -> Optional[User]:
        """
        Fetch a user by their Google OAuth subject ID.
        Used by AuthService during the Google OAuth callback.
        """
        result = await db.execute(
            select(User).where(User.google_id == google_id)
        )
        return result.scalar_one_or_none()

    async def email_exists(
        self, db: AsyncSession, *, email: str
    ) -> bool:
        """
        Check whether an email is already registered.

        FIX #6 (HIGH): Uses SQL EXISTS instead of fetching the full row.

        Old (wasteful — fetches all columns for a boolean result):
            user = await self.get_by_email(db, email=email)
            return user is not None

        New (optimal — short-circuits at first match, transfers zero data columns):
            SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)
        """
        stmt = exists().where(User.email == email.lower().strip())
        result = await db.execute(select(stmt))
        return bool(result.scalar())

    async def activate(
        self, db: AsyncSession, *, user: User
    ) -> User:
        """Mark a user account as active (is_active=True)."""
        return await self.update(db, db_obj=user, obj_in={"is_active": True})

    async def verify_email(
        self, db: AsyncSession, *, user: User
    ) -> User:
        """Mark a user's email as verified (is_verified=True)."""
        return await self.update(db, db_obj=user, obj_in={"is_verified": True})

    async def set_password(
        self, db: AsyncSession, *, user: User, hashed_password: str
    ) -> User:
        """
        Update the hashed password for a user.
        The hashing itself is done in AuthService — this repo only stores the hash.
        """
        return await self.update(
            db, db_obj=user, obj_in={"hashed_password": hashed_password}
        )


# ── Singleton instance — import this into services ────────────
user_repository = UserRepository()
