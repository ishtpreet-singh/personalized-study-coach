"""
Migration 003 — Add Two-Factor Authentication Fields

Revision ID: 003_add_2fa_fields
Previous:    002_fix_updated_at

Changes:
  1. Add two_factor_enabled (BOOLEAN NOT NULL DEFAULT FALSE) to users table.
  2. Add two_factor_secret (TEXT NULLABLE) to users table.

two_factor_enabled: Controls whether TOTP 2FA is active for this user.
                    Always starts as FALSE — only set TRUE after the user
                    successfully verifies their first OTP code.

two_factor_secret:  Stores the base32-encoded TOTP secret. Set during
                    /2fa/setup but only used when two_factor_enabled=TRUE.
                    Cleared when 2FA is disabled.

To apply:   alembic upgrade head
To reverse: alembic downgrade -1
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_add_2fa_fields"
down_revision: Union[str, None] = "002_fix_updated_at"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add two_factor_enabled — NOT NULL with server default FALSE
    op.add_column(
        "users",
        sa.Column(
            "two_factor_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # Add two_factor_secret — nullable TEXT (cleared when 2FA is disabled)
    op.add_column(
        "users",
        sa.Column(
            "two_factor_secret",
            sa.Text(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "two_factor_secret")
    op.drop_column("users", "two_factor_enabled")
