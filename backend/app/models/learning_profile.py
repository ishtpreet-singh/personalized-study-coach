import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Float, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class AILearningProfile(Base):
    __tablename__ = "learning_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Optional topic_id if we want granular tracking per topic in the future.
    # Currently it can act as an aggregate per subject if topic_id is null.
    topic_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), nullable=True, index=True)

    # Core Metrics
    mastery_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False) # 0.0 to 100.0
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False) # User self-reported or AI-inferred confidence
    quiz_accuracy: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    times_studied: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    times_revised: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Spaced Repetition / Temporal
    last_revision: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_revision: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # AI Context
    common_mistakes: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    learning_insights: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="learning_profiles")
    subject: Mapped["Subject"] = relationship("Subject", back_populates="learning_profiles")
    topic: Mapped[Optional["Topic"]] = relationship("Topic")
