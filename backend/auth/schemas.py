"""
Auth Schemas — Pydantic Models
================================
Request and response schemas for authentication endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ── Request Schemas ──────────────────────────────────────────

class UserRegister(BaseModel):
    """Schema for user registration."""
    username: str = Field(..., min_length=3, max_length=50, examples=["john_doe"])
    email: str = Field(..., max_length=100, examples=["john@example.com"])
    password: str = Field(..., min_length=4, max_length=128, examples=["strongpassword123"])
    role: Optional[str] = Field(default="viewer")


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str = Field(..., examples=["admin"])
    password: str = Field(..., examples=["admin123"])


# ── Response Schemas ─────────────────────────────────────────

class UserResponse(BaseModel):
    """Schema for returning user info (no password)."""
    id: int
    username: str
    email: str
    role: str
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for the JWT token response after login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
