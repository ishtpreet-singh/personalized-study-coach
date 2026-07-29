"""
Initial Migration — Create Users Table

Revision ID: 001
Previous Revision: None (initial migration)
Created: Phase 1 — Authentication

This migration creates the `users` table which is the root entity
for all user-owned resources (documents, quizzes, study plans).

To apply:   alembic upgrade head
To reverse: alembic downgrade -1
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# ── Revision Identifiers ──────────────────────────────────────
revision: str = "001_create_users_table"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the users table."""
    op.create_table(
        "users",
        # ── Primary Key ──────────────────────────────────────
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        # ── Identity ─────────────────────────────────────────
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        # ── Authentication ────────────────────────────────────
        sa.Column("hashed_password", sa.String(255), nullable=True),
        # ── Flags ─────────────────────────────────────────────
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default="false"),
        # ── Google OAuth ──────────────────────────────────────
        sa.Column("google_id", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        # ── Timestamps ────────────────────────────────────────
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )

    # ── Indexes ───────────────────────────────────────────────
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)


def downgrade() -> None:
    """Drop the users table."""
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
