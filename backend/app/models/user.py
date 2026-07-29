"""
User SQLAlchemy Model

FIX #22 (MEDIUM): hashed_password changed from String(255) to Text.
                   bcrypt hashes are 60 chars, but Text is future-proof
                   for algorithm migration (Argon2, scrypt outputs can exceed 255 chars).
                   PostgreSQL TEXT and VARCHAR have identical storage performance.

FIX #23 (MEDIUM): Boolean fields now carry both Python-level default= (ORM inserts)
                   AND server_default= (raw SQL inserts, migrations, fixtures).
                   Previously, direct SQL inserts had no server-side default which
                   would cause NOT NULL violations.

FIX: google_id unique index with nullable=True allows multiple NULLs in PostgreSQL.
     This is intentional PostgreSQL behavior (NULLs are not equal to each other
     in unique index comparisons). Documented explicitly here.
"""

from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class User(BaseModel):
    __tablename__ = "users"

    # ── Table-level DB constraints ─────────────────────────────
    __table_args__ = (
        # Email format sanity check at the DB level (belt-and-suspenders with Pydantic)
        CheckConstraint("email LIKE '%@%'", name="ck_users_email_format"),
        # Ensure hashed_password or google_id is always set (not both null)
        CheckConstraint(
            "hashed_password IS NOT NULL OR google_id IS NOT NULL",
            name="ck_users_auth_method_present",
        ),
    )

    # ── Identity ───────────────────────────────────────────────
    email: Mapped[str] = mapped_column(
        Text,
        unique=True,
        nullable=False,
        index=True,           # Fast lookup by email at login
    )

    full_name: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # ── Authentication ─────────────────────────────────────────
    # FIX #22: Text instead of String(255) — future-proof for non-bcrypt algorithms
    hashed_password: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,        # Null for Google OAuth-only accounts
    )

    # ── Status Flags ───────────────────────────────────────────
    # FIX #23: server_default added to all boolean columns.
    # Both default= (ORM) and server_default= (raw SQL) are required for full coverage.
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    is_superuser: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    # ── Google OAuth ───────────────────────────────────────────
    # PostgreSQL-specific: unique index on a nullable column allows multiple NULLs.
    # NULL != NULL in PostgreSQL unique index comparisons — this is correct behavior.
    # Multiple users can have no google_id; at most one user can have any given google_id.
    google_id: Mapped[Optional[str]] = mapped_column(
        Text,
        unique=True,
        nullable=True,
        index=True,
    )

    avatar_url: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # ── Two-Factor Authentication (TOTP) ──────────────────────────────
    # Phase 1.5: TOTP-based 2FA via authenticator apps.
    # two_factor_secret is set during setup but 2FA is only active when
    # two_factor_enabled=True (set only after first successful OTP verification).
    two_factor_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    two_factor_secret: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
