from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from . import schemas, service

router = APIRouter(prefix="/api/returns", tags=["Returns"])

@router.get("/", response_model=schemas.ReturnListResponse)
def get_returns(
    skip: int = Query(0, description="Pagination skip"),
    limit: int = Query(50, description="Pagination limit"),
    status: str = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """Get a paginated list of returns."""
    return service.get_returns(db, skip=skip, limit=limit, status=status)

@router.get("/stats")
def get_return_stats(db: Session = Depends(get_db)):
    """Get high-level return statistics."""
    return service.get_return_stats(db)
