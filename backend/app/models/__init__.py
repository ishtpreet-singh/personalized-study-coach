"""
Models Package

Imports all SQLAlchemy models so they register with Base.metadata.
This file is imported by db/session.py:init_db() and alembic/env.py.

Add new model imports here as each phase is implemented:
  from app.models.user import User
  from app.models.document import Document
  from app.models.quiz import QuizSession, QuizQuestion
  from app.models.quiz_result import QuizResult
  from app.models.study_plan import StudyPlan, StudyTask
"""

from app.models.user import User  # noqa: F401 — must be imported for Alembic
from app.models.document import Document, DocumentChunk
from app.models.conversation import Conversation, Message

__all__ = ["User", "Document", "DocumentChunk", "Conversation", "Message"]
