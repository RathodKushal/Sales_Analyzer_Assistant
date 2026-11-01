"""
Admin Schemas — Pydantic Request/Response Models
================================================
Schemas for user management, system-wide metrics, and platform settings.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field


# ── User Management Schemas ──────────────────────────────────

class AdminUserCreate(BaseModel):
    """Schema for admin creating a user account."""
    username: str = Field(..., min_length=3, max_length=50, examples=["ops_manager"])
    email: str = Field(..., max_length=100, examples=["ops@shopflow.ai"])
    password: str = Field(..., min_length=6, max_length=128, examples=["SecurePass123!"])
    role: str = Field(default="viewer", pattern="^(admin|manager|analyst|viewer)$")
    is_active: bool = Field(default=True)


class AdminUserUpdate(BaseModel):
    """Schema for admin updating a user account."""
    email: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = Field(None, pattern="^(admin|manager|analyst|viewer)$")
    is_active: Optional[bool] = None


class AdminPasswordReset(BaseModel):
    """Schema for admin resetting a user's password."""
    new_password: str = Field(..., min_length=6, max_length=128)


class UserAdminView(BaseModel):
    """Detailed user representation for admin panel."""
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Paginated user list with total count."""
    total: int
    users: List[UserAdminView]


# ── System Metrics Schemas ───────────────────────────────────

class UserMetrics(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    roles_breakdown: Dict[str, int]


class BusinessMetrics(BaseModel):
    total_orders: int
    total_revenue: float
    average_order_value: float
    total_customers: int
    total_products: int
    total_returns: int
    return_rate_pct: float


class SystemHealthMetrics(BaseModel):
    status: str
    app_version: str
    database_type: str
    db_size_bytes: int
    db_size_formatted: str
    python_version: str
    uptime_seconds: float
    model_dueling_dqn: bool
    model_hype_loaded: bool
    model_prophet_ready: bool


class RecentActivityItem(BaseModel):
    type: str
    title: str
    description: str
    timestamp: datetime
    badge_variant: str = "info"


class SystemMetricsResponse(BaseModel):
    users: UserMetrics
    business: BusinessMetrics
    health: SystemHealthMetrics
    activities: List[RecentActivityItem]


# ── Platform Settings Schemas ────────────────────────────────

class SettingItem(BaseModel):
    key: str
    value: str
    category: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SettingsGroup(BaseModel):
    category: str
    items: List[SettingItem]


class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, str]
