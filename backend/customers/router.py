from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from . import schemas, service

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("/", response_model=schemas.CustomerListResponse)
def get_customers(
    skip: int = Query(0, description="Pagination skip"),
    limit: int = Query(50, description="Pagination limit"),
    segment: str = Query(None, description="Filter by customer segment"),
    state: str = Query(None, description="Filter by Indian state"),
    search: str = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db)
):
    """Get a paginated list of customers with optional filters."""
    return service.get_customers(db, skip=skip, limit=limit, segment=segment, state=state, search=search)

@router.get("/stats", response_model=List[schemas.CustomerSegmentStats])
def get_customer_stats(db: Session = Depends(get_db)):
    """Get high-level statistics about customer segments."""
    return service.get_customer_stats(db)

@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get a single customer profile by ID."""
    customer = service.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
