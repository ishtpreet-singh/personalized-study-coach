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
from app.models.quiz import Question, Quiz, QuizAttempt, QuizAnswer
from app.models.topic import Topic
from app.models.support import SupportTicket, BugReport
from app.models.subject import Subject
from app.models.learning_profile import AILearningProfile
from app.models.activity import StudyActivity
from app.models.document_vector import DocumentChunkVector

__all__ = [
    "User",
    "Document",
    "DocumentChunk",
    "DocumentChunkVector",
    "Conversation",
    "Message",
    "Question",
    "Quiz",
    "QuizAttempt",
    "QuizAnswer",
    "Topic",
    "SupportTicket",
    "BugReport",
    "Subject",
    "AILearningProfile",
    "StudyActivity",
]
