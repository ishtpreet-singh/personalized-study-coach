import uuid
from typing import Optional, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import DBSession, get_current_user
from app.models.user import User
from app.models.support import SupportTicket, BugReport
from app.schemas.support import (
    SupportTicketResponse,
    BugReportResponse,
    SupportTicketListResponse,
    BugReportListResponse
)
from app.services.storage_service import storage_service

router = APIRouter(prefix="/support", tags=["Support"])

from app.api.deps import get_current_user, get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[User]:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except Exception:
        return None


@router.post("/contact", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
async def create_support_ticket(
    db: AsyncSession = Depends(get_db),
    name: str = Form(...),
    email: str = Form(...),
    subject: str = Form(...),
    description: str = Form(...),
    screenshot: Optional[UploadFile] = File(None),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Any:
    screenshot_path = None
    if screenshot:
        user_uuid = current_user.id if current_user else uuid.UUID(int=0)
        screenshot_path = await storage_service.save_file(screenshot, user_uuid)

    ticket = SupportTicket(
        user_id=current_user.id if current_user else None,
        name=name,
        email=email,
        subject=subject,
        description=description,
        screenshot_path=screenshot_path
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.post("/bug-report", response_model=BugReportResponse, status_code=status.HTTP_201_CREATED)
async def create_bug_report(
    db: AsyncSession = Depends(get_db),
    browser: Optional[str] = Form(None),
    operating_system: Optional[str] = Form(None),
    current_url: Optional[str] = Form(None),
    steps_to_reproduce: Optional[str] = Form(None),
    expected_behavior: Optional[str] = Form(None),
    actual_behavior: Optional[str] = Form(None),
    screenshot: Optional[UploadFile] = File(None),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Any:
    screenshot_path = None
    if screenshot:
        user_uuid = current_user.id if current_user else uuid.UUID(int=0)
        screenshot_path = await storage_service.save_file(screenshot, user_uuid)

    report = BugReport(
        user_id=current_user.id if current_user else None,
        browser=browser,
        operating_system=operating_system,
        current_url=current_url,
        steps_to_reproduce=steps_to_reproduce,
        expected_behavior=expected_behavior,
        actual_behavior=actual_behavior,
        screenshot_path=screenshot_path
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.get("/my-tickets", response_model=SupportTicketListResponse)
async def get_my_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = select(SupportTicket).where(SupportTicket.user_id == current_user.id).order_by(SupportTicket.created_at.desc())
    result = await db.execute(stmt)
    items = result.scalars().all()
    return {"items": items, "total": len(items)}


@router.get("/my-bug-reports", response_model=BugReportListResponse)
async def get_my_bug_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    stmt = select(BugReport).where(BugReport.user_id == current_user.id).order_by(BugReport.created_at.desc())
    result = await db.execute(stmt)
    items = result.scalars().all()
    return {"items": items, "total": len(items)}
