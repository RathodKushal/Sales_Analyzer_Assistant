"""
Sales Router — CRUD Endpoints for Sales Records
===================================================
Handles listing, creating, uploading, and summarizing sales data.
"""

import io
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth.models import User
from backend.auth.utils import get_current_user, require_admin
from backend.sales.models import SalesRecord
from backend.sales.schemas import (
    SalesRecordCreate,
    SalesRecordResponse,
    SalesListResponse,
    SalesStatsResponse,
    UploadResponse,
)

router = APIRouter(prefix="/api/sales", tags=["Sales Records"])


@router.get(
    "/",
    response_model=SalesListResponse,
    summary="List sales records (paginated)",
)
def list_sales(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=25, ge=1, le=100),
    category: Optional[str] = Query(default=None),
    region: Optional[str] = Query(default=None),
    segment: Optional[str] = Query(default=None),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List sales records with pagination and optional filtering.
    
    - **page**: Page number (starts at 1)
    - **per_page**: Records per page (max 100)
    - **category**: Filter by product category
    - **region**: Filter by region
    - **segment**: Filter by customer segment
    """
    query = db.query(SalesRecord).filter(SalesRecord.user_id == _user.id)

    # Apply filters
    if category:
        query = query.filter(SalesRecord.category == category)
    if region:
        query = query.filter(SalesRecord.region == region)
    if segment:
        query = query.filter(SalesRecord.segment == segment)

    # Get total count
    total = query.count()
    total_pages = max(1, (total + per_page - 1) // per_page)

    # Paginate
    records = (
        query.order_by(SalesRecord.id.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return SalesListResponse(
        records=[SalesRecordResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.post(
    "/",
    response_model=SalesRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new sales record",
)
def create_sale(
    payload: SalesRecordCreate,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a single new daily sales record to the database.
    
    This feeds the continuous learning pipeline — newly added records
    can be used to retrain or fine-tune the model.
    """
    record = SalesRecord(**payload.model_dump(), user_id=_user.id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get(
    "/stats",
    response_model=SalesStatsResponse,
    summary="Get summary statistics",
)
def get_stats(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns aggregate statistics across all sales records:
    total sales, profit, average discount, category breakdown, etc.
    """
    total_records = db.query(func.count(SalesRecord.id)).filter(SalesRecord.user_id == _user.id).scalar() or 0

    if total_records == 0:
        return SalesStatsResponse(
            total_records=0,
            total_sales=0.0,
            total_profit=0.0,
            avg_sales=0.0,
            avg_profit=0.0,
            avg_discount=0.0,
            total_quantity=0,
            categories={},
            regions={},
        )

    total_sales = db.query(func.sum(SalesRecord.sales)).filter(SalesRecord.user_id == _user.id).scalar() or 0.0
    total_profit = db.query(func.sum(SalesRecord.profit)).filter(SalesRecord.user_id == _user.id).scalar() or 0.0
    avg_sales = db.query(func.avg(SalesRecord.sales)).filter(SalesRecord.user_id == _user.id).scalar() or 0.0
    avg_profit = db.query(func.avg(SalesRecord.profit)).filter(SalesRecord.user_id == _user.id).scalar() or 0.0
    avg_discount = db.query(func.avg(SalesRecord.discount)).filter(SalesRecord.user_id == _user.id).scalar() or 0.0
    total_quantity = db.query(func.sum(SalesRecord.quantity)).filter(SalesRecord.user_id == _user.id).scalar() or 0

    # Category breakdown
    category_counts = (
        db.query(SalesRecord.category, func.count(SalesRecord.id))
        .filter(SalesRecord.user_id == _user.id)
        .group_by(SalesRecord.category)
        .all()
    )
    categories = {cat: count for cat, count in category_counts}

    # Region breakdown
    region_counts = (
        db.query(SalesRecord.region, func.count(SalesRecord.id))
        .group_by(SalesRecord.region)
        .all()
    )
    regions = {reg: count for reg, count in region_counts}

    return SalesStatsResponse(
        total_records=total_records,
        total_sales=round(float(total_sales), 2),
        total_profit=round(float(total_profit), 2),
        avg_sales=round(float(avg_sales), 2),
        avg_profit=round(float(avg_profit), 2),
        avg_discount=round(float(avg_discount), 4),
        total_quantity=int(total_quantity),
        categories=categories,
        regions=regions,
    )


@router.get(
    "/{record_id}",
    response_model=SalesRecordResponse,
    summary="Get a single sales record",
)
def get_sale(
    record_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single sales record by its ID."""
    record = db.query(SalesRecord).filter(SalesRecord.id == record_id, SalesRecord.user_id == _user.id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sales record #{record_id} not found",
        )
    return record




def process_and_save_sales_data(db: Session, file_path: str, user_id: int):
    """Parses a CSV/Excel file and inserts it into the SalesRecord table."""
    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        raise ValueError(f"Failed to parse file: {str(e)}")

    # Column mapping — normalize column names
    column_map = {
        "Order ID": "order_id",
        "Order Date": "order_date",
        "Ship Date": "ship_date",
        "Ship Mode": "ship_mode",
        "Segment": "segment",
        "Region": "region",
        "Category": "category",
        "Sub-Category": "sub_category",
        "Sales": "sales",
        "Quantity": "quantity",
        "Discount": "discount",
        "Profit": "profit",
    }

    # Rename columns that exist in the file
    df = df.rename(columns={k: v for k, v in column_map.items() if k in df.columns})

    # Parse dates
    import datetime
    today = datetime.date.today()
    
    if "order_date" not in df.columns:
        df["order_date"] = today
    else:
        df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce").dt.date
        df["order_date"] = df["order_date"].fillna(today)
        
    if "ship_date" not in df.columns:
        df["ship_date"] = today
    else:
        df["ship_date"] = pd.to_datetime(df["ship_date"], errors="coerce").dt.date
        df["ship_date"] = df["ship_date"].fillna(today)

    # Dynamic mapping for generic datasets
    # Map common alternatives to our schema if the exact names don't exist
    if "sales" not in df.columns:
        for col in ["amount", "revenue", "price", "total", "value", "Amount", "Revenue", "Total"]:
            if col in df.columns:
                df["sales"] = pd.to_numeric(df[col], errors="coerce")
                break
        else:
            df["sales"] = 0.0
            
    if "profit" not in df.columns:
        for col in ["margin", "net", "Profit", "Margin"]:
            if col in df.columns:
                df["profit"] = pd.to_numeric(df[col], errors="coerce")
                break
        else:
            df["profit"] = df["sales"] * 0.15 # fallback 15% profit assumption
            
    if "quantity" not in df.columns:
        for col in ["qty", "units", "count", "Quantity", "Qty"]:
            if col in df.columns:
                df["quantity"] = pd.to_numeric(df[col], errors="coerce")
                break
        else:
            df["quantity"] = 1
            
    if "category" not in df.columns:
        for col in ["type", "group", "class", "department", "Category", "Type"]:
            if col in df.columns:
                df["category"] = df[col].astype(str)
                break
        else:
            df["category"] = "General"
            
    if "region" not in df.columns:
        for col in ["location", "area", "country", "city", "state", "Region", "Location"]:
            if col in df.columns:
                df["region"] = df[col].astype(str)
                break
        else:
            df["region"] = "Global"

    if "segment" not in df.columns:
        df["segment"] = "Default"
    if "sub_category" not in df.columns:
        df["sub_category"] = "General"

    # Set defaults for optional
    if "discount" not in df.columns:
        df["discount"] = 0.0

    # Fill NaN values that might have been introduced during coercion
    df["sales"] = df["sales"].fillna(0.0)
    df["profit"] = df["profit"].fillna(0.0)
    df["quantity"] = df["quantity"].fillna(1)

    # Insert records into the database
    records_inserted = 0
    for _, row in df.iterrows():
        record = SalesRecord(
            order_id=row.get("order_id"),
            order_date=row.get("order_date"),
            ship_date=row.get("ship_date"),
            ship_mode=row.get("ship_mode"),
            segment=row["segment"],
            region=row["region"],
            category=row["category"],
            sub_category=row["sub_category"],
            sales=float(row["sales"]),
            quantity=int(row["quantity"]),
            discount=float(row.get("discount", 0.0)),
            profit=float(row["profit"]),
            user_id=user_id,
        )
        db.add(record)
        records_inserted += 1

    db.commit()
    return records_inserted


@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Bulk upload sales data from Excel/CSV",
)
async def upload_sales(
    file: UploadFile = File(...),
    _user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Upload an Excel (.xlsx) or CSV file containing sales records.
    """
    filename = file.filename or ""
    if not filename.endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .xlsx, .xls, and .csv files are supported",
        )

    import tempfile, os
    temp_path = os.path.join(tempfile.gettempdir(), filename)
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        records_inserted = process_and_save_sales_data(db, temp_path, _user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return UploadResponse(
        records_uploaded=records_inserted,
        message=f"Successfully uploaded {records_inserted} records from '{filename}'",
    )
