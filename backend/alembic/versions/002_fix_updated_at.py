"""
Migration 002 — Fix Boolean Defaults + Add updated_at Trigger

Revision ID: 002_fix_updated_at
Previous:    001_create_users_table

Changes:
  1. FIX #5  (HIGH):   Add a PostgreSQL BEFORE UPDATE trigger function (shared across
                        all tables) that reliably sets updated_at = NOW() on every update.
                        Replaces the unreliable SQLAlchemy onupdate=func.now() ORM hook.

  2. FIX #23 (MEDIUM): Alter Boolean columns to carry explicit server defaults.
                        is_active   → DEFAULT TRUE
                        is_verified → DEFAULT FALSE
                        is_superuser → DEFAULT FALSE

  3. FIX #22 (MEDIUM): Alter hashed_password, email, full_name, google_id, avatar_url
                        from VARCHAR(255) to TEXT for future algorithm compatibility.

  4. FIX: Add DB-level CHECK constraints for belt-and-suspenders validation.

To apply:   alembic upgrade head
To reverse: alembic downgrade -1
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_fix_updated_at"
down_revision: Union[str, None] = "001_create_users_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # ── 1. Create the shared trigger function ─────────────────
    # This function is reusable by ALL tables with an updated_at column.
    # Add a new trigger for each table: CREATE TRIGGER update_<table>_updated_at ...
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # ── 2. Attach trigger to the users table ──────────────────
    # BEFORE UPDATE → runs before the row is changed, sets updated_at atomically.
    # FOR EACH ROW  → fires once per modified row (not once per statement).
    op.execute("""
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    """)

    # ── 3. Fix Boolean column server defaults ─────────────────
    op.alter_column(
        "users", "is_active",
        server_default=sa.text("true"),
        existing_type=sa.Boolean(),
        existing_nullable=False,
    )
    op.alter_column(
        "users", "is_verified",
        server_default=sa.text("false"),
        existing_type=sa.Boolean(),
        existing_nullable=False,
    )
    op.alter_column(
        "users", "is_superuser",
        server_default=sa.text("false"),
        existing_type=sa.Boolean(),
        existing_nullable=False,
    )

    # ── 4. Alter VARCHAR → TEXT for future-proofing ───────────
    for column in ["email", "full_name", "hashed_password", "google_id", "avatar_url"]:
        op.alter_column(
            "users",
            column,
            type_=sa.Text(),
            existing_nullable=(column in {"hashed_password", "google_id", "avatar_url"}),
        )

    # ── 5. Add DB-level CHECK constraints ─────────────────────
    op.create_check_constraint(
        "ck_users_email_format",
        "users",
        "email LIKE '%@%'",
    )
    op.create_check_constraint(
        "ck_users_auth_method_present",
        "users",
        "hashed_password IS NOT NULL OR google_id IS NOT NULL",
    )


def downgrade() -> None:

    # Drop CHECK constraints
    op.drop_constraint("ck_users_auth_method_present", "users", type_="check")
    op.drop_constraint("ck_users_email_format", "users", type_="check")

    # Revert TEXT → VARCHAR(255)
    for column in ["email", "full_name", "hashed_password", "google_id", "avatar_url"]:
        op.alter_column(
            "users",
            column,
            type_=sa.String(255),
            existing_nullable=(column in {"hashed_password", "google_id", "avatar_url"}),
        )

    # Remove Boolean defaults (revert to nullable = engine handles it)
    for column in ["is_active", "is_verified", "is_superuser"]:
        op.alter_column(
            "users",
            column,
            server_default=None,
            existing_type=sa.Boolean(),
            existing_nullable=False,
        )

    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON users;")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
