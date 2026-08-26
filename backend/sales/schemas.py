"""
Sales Schemas — Pydantic Models
==================================
Request and response schemas for sales CRUD endpoints.
"""

from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


# ── Request Schemas ──────────────────────────────────────────

class SalesRecordCreate(BaseModel):
    """Schema for creating a new sales record."""
    order_id: Optional[str] = Field(default=None, examples=["CA-2024-100001"])
    order_date: date = Field(..., examples=["2024-06-15"])
    ship_date: Optional[date] = Field(default=None, examples=["2024-06-19"])
    ship_mode: Optional[str] = Field(default="Standard Class", examples=["Standard Class"])
    segment: str = Field(..., examples=["Consumer"])
    region: str = Field(..., examples=["West"])
    category: str = Field(..., examples=["Technology"])
    sub_category: str = Field(..., examples=["Phones"])
    sales: float = Field(..., gt=0, examples=[249.99])
    quantity: int = Field(..., ge=1, examples=[3])
    discount: float = Field(default=0.0, ge=0, le=1, examples=[0.2])
    profit: float = Field(..., examples=[45.50])


# ── Response Schemas ─────────────────────────────────────────

class SalesRecordResponse(BaseModel):
    """Schema for returning a sales record."""
    id: int
    order_id: Optional[str]
    order_date: date
    ship_date: Optional[date]
    ship_mode: Optional[str]
    segment: str
    region: str
    category: str
    sub_category: str
    sales: float
    quantity: int
    discount: float
    profit: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SalesListResponse(BaseModel):
    """Paginated list of sales records."""
    records: list[SalesRecordResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class SalesStatsResponse(BaseModel):
    """Summary statistics for sales data."""
    total_records: int
    total_sales: float
    total_profit: float
    avg_sales: float
    avg_profit: float
    avg_discount: float
    total_quantity: int
    categories: dict[str, int]   # category -> count
    regions: dict[str, int]      # region -> count


class UploadResponse(BaseModel):
    """Response after bulk uploading sales data."""
    records_uploaded: int
    message: str
