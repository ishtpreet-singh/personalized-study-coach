"""Add StudyActivity

Revision ID: 999999999999
Revises: 29de2e6979d2
Create Date: 2026-08-23 17:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '999999999999'
down_revision = '29de2e6979d2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('study_activities',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('activity_type', sa.String(length=50), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_study_activities_id'), 'study_activities', ['id'], unique=False)
    op.create_index(op.f('ix_study_activities_user_id'), 'study_activities', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_study_activities_user_id'), table_name='study_activities')
    op.drop_index(op.f('ix_study_activities_id'), table_name='study_activities')
    op.drop_table('study_activities')
