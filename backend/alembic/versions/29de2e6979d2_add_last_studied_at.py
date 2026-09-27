"""Add last_studied_at

Revision ID: 29de2e6979d2
Revises: 5fc5b2e1d3db
Create Date: 2026-08-03 21:04:10.390194

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '29de2e6979d2'
down_revision: Union[str, None] = '5fc5b2e1d3db'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subjects', sa.Column('last_studied_at', sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    op.drop_column('subjects', 'last_studied_at')
