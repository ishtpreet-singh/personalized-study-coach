"""
SQLAlchemy Base Model — Shared Mixin

FIX #5 (HIGH): Removed unreliable onupdate=func.now() from updated_at.
               The SQLAlchemy onupdate hook does NOT fire reliably with:
                 - async sessions (expire_on_commit=False)
                 - dict-based updates through the repository layer
               A PostgreSQL-level BEFORE UPDATE trigger is added in migration
               002_add_updated_at_trigger.py and fires 100% of the time.

All models continue to inherit: UUID primary key, created_at, updated_at.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TimestampMixin:
    """
    Adds created_at and updated_at timestamps to any model.

    FIX #5: updated_at no longer uses onupdate=func.now().
    Instead, migration 002_... installs a PostgreSQL BEFORE UPDATE trigger
    that sets updated_at = NOW() for every UPDATE on every table.
    This is reliable regardless of how the UPDATE was issued (ORM, raw SQL, etc.).
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        # onupdate= intentionally removed — handled by PostgreSQL trigger in migration 002
        nullable=False,
    )


class UUIDMixin:
    """Adds a UUID primary key to any model."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )


class BaseModel(UUIDMixin, TimestampMixin, Base):
    """
    Abstract base that all project models should extend.

    Provides:
      - UUID primary key (Python-generated uuid4)
      - created_at timestamp (server default: NOW())
      - updated_at timestamp (maintained by PostgreSQL trigger — see migration 002)

    Usage:
        class User(BaseModel):
            __tablename__ = "users"
            ...
    """
    __abstract__ = True
