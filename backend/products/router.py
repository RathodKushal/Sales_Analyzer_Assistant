from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from . import schemas, service

router = APIRouter(prefix="/api/products", tags=["Products"])

# ── Inventory Specific Endpoints (for Inventory Control) ───────

@router.get("/inventory", response_model=List[schemas.InventoryItemResponse])
def get_inventory(
    includeArchived: bool = Query(False, alias="includeArchived", description="Include soft-deleted/archived items"),
    include_archived: bool = Query(False, description="Snake_case alternative for include archived"),
    approval_status: Optional[str] = Query("active", description="Filter by approval status ('active', 'pending_approval', 'all')"),
    search: Optional[str] = Query(None, description="Search filter"),
    db: Session = Depends(get_db)
):
    """Get all inventory catalog items with supplier info. Defaults to only approved/active products."""
    should_include = includeArchived or include_archived
    return service.get_inventory_items(db, include_archived=should_include, search=search, approval_status=approval_status)

@router.post("/", response_model=schemas.InventoryItemResponse)
def create_product(
    data: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    """Create or register a new inventory SKU product."""
    prod = service.create_inventory_item(db, data)
    sup_name = None
    sup_contact = None
    if prod.supplier_id:
        from . import models
        s = db.query(models.Supplier).filter(models.Supplier.id == prod.supplier_id).first()
        if s:
            sup_name = s.name
            sup_contact = s.contact_info

    return {
        "id": prod.id,
        "name": prod.description,
        "sku": prod.stock_code,
        "price": float(prod.avg_price or 0.0),
        "stock": int(prod.stock or 0),
        "supplier_id": prod.supplier_id,
        "supplier_name": sup_name,
        "supplier_contact": sup_contact,
        "is_deleted": bool(prod.is_deleted),
        "approval_status": prod.approval_status or "active",
    }

@router.put("/{id}", response_model=schemas.InventoryItemResponse)
def update_product(
    id: int,
    data: schemas.ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing product record."""
    prod = service.update_inventory_item(db, id, data)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    sup_name = None
    sup_contact = None
    if prod.supplier_id:
        from . import models
        s = db.query(models.Supplier).filter(models.Supplier.id == prod.supplier_id).first()
        if s:
            sup_name = s.name
            sup_contact = s.contact_info

    return {
        "id": prod.id,
        "name": prod.description,
        "sku": prod.stock_code,
        "price": float(prod.avg_price or 0.0),
        "stock": int(prod.stock or 0),
        "supplier_id": prod.supplier_id,
        "supplier_name": sup_name,
        "supplier_contact": sup_contact,
        "is_deleted": bool(prod.is_deleted),
        "approval_status": prod.approval_status or "active",
    }

@router.delete("/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    """Soft-delete / archive product from active inventory."""
    success = service.delete_inventory_item(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product archived. Customer transactions and past history remain completely preserved."}

@router.post("/{id}/restore")
def restore_product(id: int, db: Session = Depends(get_db)):
    """Restore an archived product back to active inventory."""
    success = service.restore_inventory_item(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product restored to active inventory."}

# ── Restock & Multi-Stage Procurement Protocol ───────────────

@router.get("/restock-requests", response_model=List[schemas.RestockRequestResponse])
def list_restock_requests(
    status: Optional[str] = Query(None, description="Filter by request status"),
    request_type: Optional[str] = Query(None, description="Filter by request type: restock or new_product"),
    db: Session = Depends(get_db)
):
    """List all restock and new product procurement requests."""
    return service.get_restock_requests(db, status=status, request_type=request_type)

@router.post("/restock-requests", response_model=schemas.RestockRequestResponse)
def create_restock_request(
    data: schemas.RestockRequestCreate,
    db: Session = Depends(get_db)
):
    """Inventory Manager initiates a restock or new product request for the PO Manager."""
    return service.create_restock_request(db, data)

@router.put("/restock-requests/{request_id}/status", response_model=schemas.RestockRequestResponse)
def update_restock_request_status(
    request_id: int,
    data: schemas.RestockStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update workflow status (PO manager approval, Manufacturer acceptance, shipment, restock confirmation)."""
    updated = service.update_restock_request_status(db, request_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Restock request not found")
    return updated

# ── General Catalog Endpoints ─────────────────────────────────

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
