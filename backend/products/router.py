from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from . import schemas, service

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("/", response_model=schemas.ProductListResponse)
def get_products(
    skip: int = Query(0, description="Pagination skip"),
    limit: int = Query(50, description="Pagination limit"),
    category: str = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    """Get a paginated list of products."""
    return service.get_products(db, skip=skip, limit=limit, category=category)

@router.get("/top-sellers", response_model=List[schemas.ProductResponse])
def get_top_sellers(limit: int = 10, db: Session = Depends(get_db)):
    """Get top selling products."""
    return service.get_top_sellers(db, limit=limit)

@router.get("/{stock_code}", response_model=schemas.ProductResponse)
def get_product(stock_code: str, db: Session = Depends(get_db)):
    """Get a single product detail."""
    product = service.get_product(db, stock_code)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
