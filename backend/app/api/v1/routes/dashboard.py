from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import Any

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.dashboard_service import dashboard_service

router = APIRouter()

@router.get("/metrics", response_model=Any)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all dashboard metrics for the current user."""
    return await dashboard_service.get_dashboard_metrics(db, current_user.id)
