from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from . import schemas, service

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# ── Billing / POS Endpoints ────────────────────────────────────────

@router.post("/billing", response_model=schemas.BillInvoiceResponse)
def create_bill(
    bill_data: schemas.BillCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a new bill / invoice (Point of Sale).
    - Validates product active status and stock availability.
    - Atomically reduces product inventory.
    - Creates or links customer by phone/email.
    - Stores order and order_items in central database.
    """
    return service.create_bill(db, bill_data)

@router.get("/invoices", response_model=schemas.InvoiceListResponse)
def get_invoices(
    skip: int = Query(0, description="Pagination skip"),
    limit: int = Query(50, description="Pagination limit"),
    search: Optional[str] = Query(None, description="Search by invoice #, customer name, phone, email"),
    db: Session = Depends(get_db)
):
    """Get bill / invoice history."""
    return service.get_invoices(db, skip=skip, limit=limit, search=search)

@router.get("/invoices/{invoice_id}", response_model=schemas.BillInvoiceResponse)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Get single invoice details by invoice ID or order ID."""
    invoice = service.get_invoice(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

# ── General Order Endpoints ────────────────────────────────────────

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
