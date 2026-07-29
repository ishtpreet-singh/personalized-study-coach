"""
User Pydantic Schemas

Defines the shape of data entering and leaving the User resource.
Each schema serves a specific purpose:
  - UserBase       : Shared fields (no sensitive data)
  - UserCreate     : Registration payload (includes password)
  - UserUpdate     : Partial update payload (all fields optional)
  - UserInDB       : Internal representation (includes hashed_password)
  - UserResponse   : Safe outbound representation (no password)

FIX #10 (MEDIUM): Password strength validation now uses the shared
                   validate_password_strength() function from schemas/validators.py
                   instead of inline regex — consistent with PasswordChangeRequest.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.validators import validate_password_strength


class UserBase(BaseModel):
    """Fields shared across User schemas."""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)


class UserCreate(UserBase):
    """
    Payload for POST /auth/register.
    Password is validated for strength before the service hashes it.
    """
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Enforce strength via the shared validator."""
        return validate_password_strength(v)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        return v.strip()


class UserUpdate(BaseModel):
    """
    Payload for PATCH /users/me — all fields optional (PATCH semantics).
    Password updates go through a dedicated change-password endpoint.
    """
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    avatar_url: Optional[str] = Field(None, max_length=512)


class UserInDB(UserBase):
    """
    Internal schema used by the repository layer.
    Contains hashed_password — never returned to the API consumer.
    """
    id: UUID
    hashed_password: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    """
    Safe outbound schema — returned by all API endpoints.
    Never exposes hashed_password, google_id, or two_factor_secret.
    """
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    is_verified: bool
    two_factor_enabled: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
