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

from app.api.v1.routes import auth

api_router = APIRouter()

# ── Phase 1: Authentication ────────────────────────────────────
api_router.include_router(auth.router)

# ── Future phases (uncomment as each is implemented) ──────────
# from app.api.v1.routes import documents
# api_router.include_router(documents.router)

# from app.api.v1.routes import rag
# api_router.include_router(rag.router)

# from app.api.v1.routes import quiz
# api_router.include_router(quiz.router)

# from app.api.v1.routes import adaptive
# api_router.include_router(adaptive.router)

# from app.api.v1.routes import calendar
# api_router.include_router(calendar.router)
