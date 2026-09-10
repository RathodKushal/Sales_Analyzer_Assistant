from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from . import schemas, service

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.get("/", response_model=schemas.OrderListResponse)
def get_orders(
    skip: int = Query(0, description="Pagination skip"),
    limit: int = Query(50, description="Pagination limit"),
    customer_id: int = Query(None, description="Filter by customer ID"),
    status: str = Query(None, description="Filter by order status"),
    db: Session = Depends(get_db)
):
    """Get a paginated list of orders."""
    return service.get_orders(db, skip=skip, limit=limit, customer_id=customer_id, status=status)

@router.get("/stats")
def get_order_stats(db: Session = Depends(get_db)):
    """Get high-level order statistics."""
    return service.get_order_stats(db)

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    """Get a single order detail."""
    order = service.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
