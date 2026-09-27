"""
API V1 — Main Router

All feature route modules are registered here under /api/v1.
This file is the single source of truth for which features are live.

Adding a new feature:
  1. Create app/api/v1/routes/<feature>.py
  2. Import its router here
  3. Call api_router.include_router(...)
"""

from fastapi import APIRouter

from app.api.v1.routes import auth, documents, quizzes, conversations, chat, support, subjects, dashboard

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(support.router)
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])

# from app.api.v1.routes import rag
# api_router.include_router(rag.router)


# from app.api.v1.routes import adaptive
# api_router.include_router(adaptive.router)

# from app.api.v1.routes import calendar
# api_router.include_router(calendar.router)
