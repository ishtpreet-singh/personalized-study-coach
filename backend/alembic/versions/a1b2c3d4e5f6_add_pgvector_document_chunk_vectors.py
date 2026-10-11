"""add pgvector and document_chunk_vectors table

Revision ID: a1b2c3d4e5f6
Revises: 999999999999
Create Date: 2026-10-09 23:35:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '999999999999'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Enable pgvector extension deterministically
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2. Create document_chunk_vectors table with foreign keys and 3072-dim vector column
    op.create_table(
        'document_chunk_vectors',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('chunk_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('embedding', Vector(3072), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['chunk_id'], ['document_chunks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('chunk_id', name='uq_document_chunk_vectors_chunk_id'),
    )

    # 3. Create deterministic B-tree indexes for strict subject and user isolation
    op.create_index(op.f('ix_document_chunk_vectors_id'), 'document_chunk_vectors', ['id'], unique=False)
    op.create_index(op.f('ix_document_chunk_vectors_chunk_id'), 'document_chunk_vectors', ['chunk_id'], unique=True)
    op.create_index(op.f('ix_document_chunk_vectors_document_id'), 'document_chunk_vectors', ['document_id'], unique=False)
    op.create_index(op.f('ix_document_chunk_vectors_subject_id'), 'document_chunk_vectors', ['subject_id'], unique=False)
    op.create_index(op.f('ix_document_chunk_vectors_user_id'), 'document_chunk_vectors', ['user_id'], unique=False)
    op.create_index('idx_chunk_vectors_subject_user', 'document_chunk_vectors', ['subject_id', 'user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_chunk_vectors_subject_user', table_name='document_chunk_vectors')
    op.drop_index(op.f('ix_document_chunk_vectors_user_id'), table_name='document_chunk_vectors')
    op.drop_index(op.f('ix_document_chunk_vectors_subject_id'), table_name='document_chunk_vectors')
    op.drop_index(op.f('ix_document_chunk_vectors_document_id'), table_name='document_chunk_vectors')
    op.drop_index(op.f('ix_document_chunk_vectors_chunk_id'), table_name='document_chunk_vectors')
    op.drop_index(op.f('ix_document_chunk_vectors_id'), table_name='document_chunk_vectors')
    op.drop_table('document_chunk_vectors')
