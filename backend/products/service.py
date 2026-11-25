from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime
from . import models, schemas
from typing import Optional, List

def get_products(db: Session, skip: int = 0, limit: int = 50, category: Optional[str] = None):
    """
    Get paginated products catalog.
    Strictly filters for approved products accepted by Purchase Order Manager (approval_status == 'active').
    """
    query = db.query(models.Product).filter(
        models.Product.approval_status == "active",
        or_(models.Product.is_deleted == False, models.Product.is_deleted == None)
    )
    
    if category:
        query = query.filter(models.Product.category == category)
        
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1 if limit else 1,
        "size": len(products),
        "products": products
    }

def get_product(db: Session, stock_code: str):
    """Get single product detail, ensuring it is accepted and active."""
    return db.query(models.Product).filter(
        models.Product.stock_code == stock_code,
        models.Product.approval_status == "active",
        or_(models.Product.is_deleted == False, models.Product.is_deleted == None)
    ).first()

def get_top_sellers(db: Session, limit: int = 10):
    """Get top selling active products."""
    return db.query(models.Product).filter(
        models.Product.approval_status == "active",
        or_(models.Product.is_deleted == False, models.Product.is_deleted == None)
    ).order_by(models.Product.total_quantity_sold.desc()).limit(limit).all()

# ── Inventory & Vendor Services ─────────────────────────────────

def get_inventory_items(
    db: Session, 
    include_archived: bool = False, 
    search: Optional[str] = None,
    approval_status: Optional[str] = "active"
):
    query = db.query(
        models.Product,
        models.Supplier.name.label("supplier_name"),
        models.Supplier.contact_info.label("supplier_contact")
    ).outerjoin(models.Supplier, models.Product.supplier_id == models.Supplier.id)

    if not include_archived:
        query = query.filter(or_(models.Product.is_deleted == False, models.Product.is_deleted == None))

    # By default, only return products that have been accepted/approved by the Purchase Order Manager!
    if approval_status and approval_status != "all":
        if approval_status == "active":
            query = query.filter(models.Product.approval_status == "active")
        else:
            query = query.filter(models.Product.approval_status == approval_status)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Product.description.ilike(term),
                models.Product.stock_code.ilike(term),
                models.Supplier.name.ilike(term)
            )
        )

    results = query.order_by(models.Product.id.asc()).all()

    items = []
    for prod, sup_name, sup_contact in results:
        items.append({
            "id": prod.id,
            "name": prod.description or "Unnamed Product",
            "sku": prod.stock_code or f"SKU-{prod.id}",
            "price": float(prod.avg_price or 0.0),
            "stock": int(prod.stock if prod.stock is not None else 0),
            "supplier_id": prod.supplier_id,
            "supplier_name": sup_name,
            "supplier_contact": sup_contact,
            "is_deleted": bool(prod.is_deleted),
            "approval_status": prod.approval_status or "active",
        })
    return items

def create_inventory_item(db: Session, data: schemas.ProductCreate):
    existing = db.query(models.Product).filter(models.Product.stock_code == data.sku).first()
    if existing:
        # If product exists and is archived, reactivate and update it
        existing.description = data.name
        existing.avg_price = data.price
        existing.stock = data.stock
        existing.supplier_id = data.supplier_id
        existing.is_deleted = False
        db.commit()
        db.refresh(existing)
        return existing

    # Newly registered products must remain in queue as 'pending_approval' until accepted by Purchase Order Manager
    status = "pending_approval"
    qty_requested = int(data.stock if data.stock is not None and data.stock > 0 else 0)
    new_prod = models.Product(
        stock_code=data.sku,
        description=data.name,
        avg_price=data.price,
        stock=0,
        supplier_id=data.supplier_id,
        category="General",
        is_deleted=False,
        approval_status=status
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)

    # Automatically notify / create a review request for Purchase Order Manager in the approval queue
    sup = db.query(models.Supplier).filter(models.Supplier.id == data.supplier_id).first() if data.supplier_id else None
    req = models.RestockRequest(
        request_type="new_product",
        product_id=new_prod.id,
        product_name=new_prod.description,
        sku=new_prod.stock_code,
        requested_quantity=qty_requested,
        current_stock=0,
        unit_price=float(new_prod.avg_price or 0.0),
        supplier_id=new_prod.supplier_id,
        supplier_name=sup.name if sup else "Unassigned",
        status="pending_purchase_approval",
        priority="normal",
        notes=f"New product registration submitted by Inventory Manager for {qty_requested} units. Placed in Approval Queue awaiting Purchase Order Manager acceptance.",
    )
    db.add(req)
    db.commit()

    return new_prod

def update_inventory_item(db: Session, item_id: int, data: schemas.ProductUpdate):
    prod = db.query(models.Product).filter(models.Product.id == item_id).first()
    if not prod:
        return None
    if data.name is not None:
        prod.description = data.name
    if data.sku is not None:
        prod.stock_code = data.sku
    if data.price is not None:
        prod.avg_price = data.price
    if data.stock is not None:
        prod.stock = data.stock
    if data.supplier_id is not None:
        prod.supplier_id = data.supplier_id
    if data.approval_status is not None:
        prod.approval_status = data.approval_status
    db.commit()
    db.refresh(prod)
    return prod

def delete_inventory_item(db: Session, item_id: int):
    prod = db.query(models.Product).filter(models.Product.id == item_id).first()
    if not prod:
        return False
    prod.is_deleted = True
    prod.deleted_at = datetime.utcnow()
    db.commit()
    return True

def restore_inventory_item(db: Session, item_id: int):
    prod = db.query(models.Product).filter(models.Product.id == item_id).first()
    if not prod:
        return False
    prod.is_deleted = False
    prod.deleted_at = None
    db.commit()
    return True

def get_suppliers(db: Session):
    return db.query(models.Supplier).order_by(models.Supplier.name.asc()).all()

def create_supplier(db: Session, data: schemas.SupplierCreate):
    sup = models.Supplier(
        name=data.name,
        contact_info=data.contact_info,
        contact_email=data.contact_info if "@" in (data.contact_info or "") else None,
        rating=5.0
    )
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup

# ── Restock & Procurement Supply Chain Protocol ───────────────

def create_restock_request(db: Session, data: schemas.RestockRequestCreate):
    unit_price = 0.0
    current_stock = 0
    supplier_name = None
    supplier_id = data.supplier_id

    if data.product_id:
        prod = db.query(models.Product).filter(models.Product.id == data.product_id).first()
        if prod:
            unit_price = float(prod.avg_price or 0.0)
            current_stock = int(prod.stock or 0)
            if not supplier_id:
                supplier_id = prod.supplier_id

    if supplier_id:
        sup = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
        if sup:
            supplier_name = sup.name

    req = models.RestockRequest(
        request_type=data.request_type or "restock",
        product_id=data.product_id,
        product_name=data.product_name,
        sku=data.sku,
        requested_quantity=int(data.requested_quantity) if data.requested_quantity is not None else 0,
        current_stock=current_stock,
        unit_price=unit_price,
        supplier_id=supplier_id,
        supplier_name=supplier_name or "Unassigned Vendor",
        status="pending_purchase_approval",
        priority=data.priority or "normal",
        notes=data.notes,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

def get_restock_requests(
    db: Session, 
    status: Optional[str] = None, 
    request_type: Optional[str] = None
):
    query = db.query(models.RestockRequest)
    if status and status != "all":
        status_clean = status.lower().strip()
        if status_clean in ["ordered_to_manufacturer", "with_manufacturer"]:
            query = query.filter(models.RestockRequest.status.in_(["ordered_to_manufacturer", "accepted_by_manufacturer", "in_production"]))
        elif status_clean in ["shipped_to_purchase", "ready_to_restock", "shipped"]:
            query = query.filter(models.RestockRequest.status.in_(["shipped_to_purchase", "ready_to_restock", "shipped"]))
        elif status_clean in ["received_and_restocked", "restocked", "completed"]:
            query = query.filter(models.RestockRequest.status.in_(["received_and_restocked", "restocked", "completed"]))
        elif status_clean in ["pending_purchase_approval", "awaiting_po", "pending"]:
            query = query.filter(models.RestockRequest.status.in_(["pending_purchase_approval", "pending"]))
        else:
            query = query.filter(models.RestockRequest.status == status)
    if request_type and request_type != "all":
        query = query.filter(models.RestockRequest.request_type == request_type)
    return query.order_by(models.RestockRequest.id.desc()).all()

def update_restock_request_status(
    db: Session, 
    request_id: int, 
    update_data: schemas.RestockStatusUpdate
):
    req = db.query(models.RestockRequest).filter(models.RestockRequest.id == request_id).first()
    if not req:
        return None

    new_status = update_data.status
    req.status = new_status
    req.updated_at = datetime.utcnow()

    if update_data.notes:
        req.notes = update_data.notes

    if update_data.po_number:
        req.po_number = update_data.po_number
    elif new_status == "ordered_to_manufacturer" and not req.po_number:
        req.po_number = f"PO-2026-RESTOCK-{req.id:04d}"

    # The product is admitted into the inventory catalog as soon as the Purchase Order Manager accepts the request!
    if new_status in ["ordered_to_manufacturer", "accepted_by_manufacturer", "shipped_to_purchase", "received_and_restocked", "approved"]:
        if req.product_id:
            prod = db.query(models.Product).filter(models.Product.id == req.product_id).first()
            if prod:
                prod.approval_status = "active"
        elif req.sku:
            prod = db.query(models.Product).filter(models.Product.stock_code == req.sku).first()
            if prod:
                prod.approval_status = "active"
    elif new_status == "rejected":
        if req.product_id:
            prod = db.query(models.Product).filter(models.Product.id == req.product_id).first()
            if prod:
                prod.approval_status = "rejected"
        elif req.sku:
            prod = db.query(models.Product).filter(models.Product.stock_code == req.sku).first()
            if prod:
                prod.approval_status = "rejected"

    # 4. Final step: PO Manager issues Return Back statement and restocks item into inventory
    if new_status == "received_and_restocked":
        req.completed_at = datetime.utcnow()
        if update_data.return_back_statement:
            req.return_back_statement = update_data.return_back_statement
        else:
            req.return_back_statement = (
                f"Goods Receipt Note: Verified {req.requested_quantity} units received in full "
                f"from {req.supplier_name or 'Manufacturer'}. Quality clearance approved by Purchase Order Department. "
                f"Returned and credited directly to warehouse inventory."
            )

        # Directly update product inventory stock!
        if req.product_id:
            prod = db.query(models.Product).filter(models.Product.id == req.product_id).first()
            if prod:
                prod.stock = int(prod.stock or 0) + int(req.requested_quantity)
                prod.approval_status = "active"
        elif req.sku:
            prod = db.query(models.Product).filter(models.Product.stock_code == req.sku).first()
            if prod:
                prod.stock = int(prod.stock or 0) + int(req.requested_quantity)
                prod.approval_status = "active"

    db.commit()
    db.refresh(req)
    return req
