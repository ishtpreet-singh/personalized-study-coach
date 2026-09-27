from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.support import SupportTicketStatus, BugReportStatus

# -- Support Ticket --

class SupportTicketCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    screenshot_path: Optional[str] = None

class SupportTicketResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    name: str
    email: str
    subject: str
    description: str
    screenshot_path: Optional[str]
    status: SupportTicketStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -- Bug Report --

class BugReportCreate(BaseModel):
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    current_url: Optional[str] = None
    timestamp: Optional[datetime] = None
    steps_to_reproduce: Optional[str] = None
    expected_behavior: Optional[str] = None
    actual_behavior: Optional[str] = None
    screenshot_path: Optional[str] = None

class BugReportResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    browser: Optional[str]
    operating_system: Optional[str]
    current_url: Optional[str]
    timestamp: Optional[datetime]
    steps_to_reproduce: Optional[str]
    expected_behavior: Optional[str]
    actual_behavior: Optional[str]
    screenshot_path: Optional[str]
    status: BugReportStatus
    created_at: datetime

    class Config:
        from_attributes = True

class SupportTicketListResponse(BaseModel):
    items: list[SupportTicketResponse]
    total: int

class BugReportListResponse(BaseModel):
    items: list[BugReportResponse]
    total: int
