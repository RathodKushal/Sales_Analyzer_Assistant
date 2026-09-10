"""
Reports Schemas — Pydantic Models
====================================
Request and response schemas for PDF report generation endpoints.
"""

from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional
from enum import Enum


# ── Enums ────────────────────────────────────────────────────

class ReportTemplate(str, Enum):
    """Available report template types."""
    DAILY_SUMMARY = "daily_summary"
    MONTHLY_ANALYSIS = "monthly_analysis"
    CATEGORY_BREAKDOWN = "category_breakdown"
    FULL_REPORT = "full_report"


# ── Request Schemas ──────────────────────────────────────────

class ReportGenerateRequest(BaseModel):
    """Request to generate a PDF report."""
    template: ReportTemplate = Field(
        default=ReportTemplate.FULL_REPORT,
        description="Report template type",
        examples=["full_report"],
    )
    date_from: Optional[date] = Field(
        default=None,
        description="Start date filter (inclusive). Defaults to all data.",
        examples=["2024-01-01"],
    )
    date_to: Optional[date] = Field(
        default=None,
        description="End date filter (inclusive). Defaults to today.",
        examples=["2024-12-31"],
    )
    category: Optional[str] = Field(
        default=None,
        description="Filter by product category",
        examples=["Technology"],
    )
    region: Optional[str] = Field(
        default=None,
        description="Filter by region",
        examples=["West"],
    )


# ── Response Schemas ─────────────────────────────────────────

class ReportMeta(BaseModel):
    """Metadata about a generated report."""
    report_id: str
    template: str
    filename: str
    generated_at: datetime
    record_count: int
    file_size_kb: float


class ReportGenerateResponse(BaseModel):
    """Response after generating a report."""
    status: str = "success"
    message: str
    report: ReportMeta


class ReportTemplateInfo(BaseModel):
    """Information about an available report template."""
    id: str
    name: str
    description: str
    available: bool = True


class ReportTemplatesResponse(BaseModel):
    """Response listing all available report templates."""
    templates: list[ReportTemplateInfo]
