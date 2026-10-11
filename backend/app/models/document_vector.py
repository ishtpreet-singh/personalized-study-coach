import uuid
from datetime import datetime
from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class DocumentChunkVector(Base):
    __tablename__ = "document_chunk_vectors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    chunk_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # 3072-dimensional embedding vector matching Google Gemini models/gemini-embedding-001
    embedding = mapped_column(Vector(3072), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    chunk = relationship("DocumentChunk", backref="vector")
    document = relationship("Document", backref="vectors")
    subject = relationship("Subject")
    user = relationship("User")

    __table_args__ = (
        Index("idx_chunk_vectors_subject_user", "subject_id", "user_id"),
        Index("idx_chunk_vectors_document", "document_id"),
    )
