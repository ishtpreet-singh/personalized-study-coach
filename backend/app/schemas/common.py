"""
Common Schemas

Shared Pydantic schemas used across multiple features.
Place cross-cutting response types here — not in feature-specific schema files.

FIX #26 (LOW): MessageResponse moved here from schemas/auth.py.
               It belongs in common.py since it is used by all features
               (auth, documents, quizzes, etc.) not just authentication.
"""

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

DataT = TypeVar("DataT")


class MessageResponse(BaseModel):
    """
    Generic success/info message for endpoints with no data payload.

    Usage:
        return MessageResponse(message="Password updated successfully.")
    """
    message: str


class APIResponse(BaseModel, Generic[DataT]):
    """
    Generic typed API response envelope.

    Usage:
        return APIResponse[UserResponse](data=user, message="Created")
    """
    success: bool = True
    message: Optional[str] = None
    data: Optional[DataT] = None


class ErrorDetail(BaseModel):
    """
    Structured error detail for validation and HTTP errors.
    Returned by the global exception handler in main.py.
    """
    field: Optional[str] = None
    message: str
    code: Optional[str] = None
