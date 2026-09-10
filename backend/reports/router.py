"""
Reports Router — PDF Report Generation
==========================================
Generates, lists, and downloads PDF sales reports.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth.models import User
from backend.auth.utils import get_current_user
from backend.reports.service import ReportService
from backend.reports.schemas import (
    ReportGenerateRequest,
    ReportGenerateResponse,
    ReportMeta,
    ReportTemplateInfo,
    ReportTemplatesResponse,
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post(
    "/generate",
    response_model=ReportGenerateResponse,
    summary="Generate a PDF sales report",
)
def generate_report(
    payload: ReportGenerateRequest,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a downloadable PDF report summarizing sales performance,
    category/region breakdowns, and embedded charts.

    **Filters** — Optionally filter by date range, category, or region.
    **Templates** — `full_report`, `daily_summary`, `monthly_analysis`, `category_breakdown`.
    """
    try:
        result = ReportService.generate_report(
            db=db,
            template=payload.template.value,
            date_from=payload.date_from,
            date_to=payload.date_to,
            category=payload.category,
            region=payload.region,
            user_id=_user.id,
        )
        return ReportGenerateResponse(
            status="success",
            message=f"Report generated with {result['record_count']} records",
            report=ReportMeta(**result),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        )


@router.get(
    "/download/{filename}",
    summary="Download a generated PDF report",
)
def download_report(
    filename: str,
    _user: User = Depends(get_current_user),
):
    """
    Download a previously generated PDF report by its filename.
    """
    path = ReportService.get_report_path(filename)
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{filename}' not found",
        )

    return FileResponse(
        path=str(path),
        filename=filename,
        media_type="application/pdf",
    )


@router.get(
    "/list",
    summary="List all generated reports",
)
def list_reports(_user: User = Depends(get_current_user)):
    """List all previously generated PDF reports available for download."""
    reports = ReportService.list_reports(_user.id)
    return {"reports": reports, "total": len(reports)}


@router.get(
    "/templates",
    response_model=ReportTemplatesResponse,
    summary="List available report templates",
)
def list_templates(_user: User = Depends(get_current_user)):
    """List all available report templates and their descriptions."""
    return ReportTemplatesResponse(
        templates=[
            ReportTemplateInfo(
                id="full_report",
                name="Full Comprehensive Report",
                description="Complete report with KPIs, category/region breakdowns, and charts.",
            ),
            ReportTemplateInfo(
                id="daily_summary",
                name="Daily Sales Summary",
                description="Quick overview of today's sales performance and key metrics.",
            ),
            ReportTemplateInfo(
                id="monthly_analysis",
                name="Monthly Analysis",
                description="Month-over-month trends, growth rates, and seasonal patterns.",
            ),
            ReportTemplateInfo(
                id="category_breakdown",
                name="Category Breakdown",
                description="Detailed analysis by product category with profit margins.",
            ),
        ]
    )
