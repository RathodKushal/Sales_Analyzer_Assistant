from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException
from datetime import datetime
import random
from typing import Optional

from . import models, schemas
from backend.customers.models import Customer
from backend.products.models import Product

def get_orders(db: Session, skip: int = 0, limit: int = 50, customer_id: Optional[int] = None, status: Optional[str] = None):
    query = db.query(models.Order).filter(models.Order.invoice_number.isnot(None))
    
    if customer_id:
        query = query.filter(models.Order.customer_id == customer_id)
    if status:
        query = query.filter(models.Order.status == status)
        
    total = query.count()
    orders = query.order_by(models.Order.order_date.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1 if limit else 1,
        "size": len(orders),
        "orders": orders
    }

def get_order(db: Session, order_id: str):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if order:
        order.items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()
    return order

def get_order_stats(db: Session):
    query = db.query(models.Order).filter(models.Order.invoice_number.isnot(None))
    total_orders = query.count()
    total_revenue = db.query(func.sum(models.Order.total_amount)).filter(models.Order.invoice_number.isnot(None)).scalar() or 0.0
    avg_order_value = (total_revenue / total_orders) if total_orders > 0 else 0.0
    
    # Revenue by state
    state_revenue = db.query(
        models.Order.state,
        func.sum(models.Order.total_amount).label('revenue')
    ).filter(models.Order.invoice_number.isnot(None)).group_by(models.Order.state).order_by(func.sum(models.Order.total_amount).desc()).limit(5).all()
    
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "average_order_value": avg_order_value,
        "top_states": [{"state": s.state, "revenue": s.revenue} for s in state_revenue if s.state and s.state != "-"]
    }

# ── Billing / POS Service Implementation ───────────────────────────

def create_bill(db: Session, bill_data: schemas.BillCreateRequest):
    """
    Generate an invoice/bill, validate products and stock, deduct inventory,
    link/create customer, and record order, order items, and payment.
    """
    if not bill_data.items:
        raise HTTPException(status_code=400, detail="Cannot generate bill with empty item list.")

    # 1. Product validation and inventory checks
    validated_items = []
    subtotal = 0.0

    for item in bill_data.items:
        prod = None
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod and item.stock_code:
            prod = db.query(Product).filter(Product.stock_code == item.stock_code).first()

        if not prod or getattr(prod, "is_deleted", False):
            raise HTTPException(
                status_code=400,
                detail=f"Product with code '{item.stock_code}' was not found or is discontinued."
            )

        # Requirement: Only products with approval_status == 'active' and stock > 0 can be billed.
        approval = getattr(prod, "approval_status", "active") or "active"
        if approval != "active":
            raise HTTPException(
                status_code=400,
                detail=f"Product '{prod.description}' ({prod.stock_code}) is not active for sale (status: {approval})."
            )

        available_stock = int(prod.stock or 0)
        if available_stock <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Product '{prod.description}' ({prod.stock_code}) is out of stock (available: 0)."
            )

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Quantity for product '{prod.description}' must be greater than 0."
            )

        if item.quantity > available_stock:
            raise HTTPException(
                status_code=400,
                detail=f"Requested quantity ({item.quantity}) for '{prod.description}' exceeds available stock ({available_stock})."
            )

        unit_price = float(item.unit_price if item.unit_price > 0 else (prod.avg_price or 0.0))
        item_disc = max(0.0, float(item.discount or 0.0))
        line_total = max(0.0, round((unit_price * item.quantity) - item_disc, 2))
        subtotal += line_total

        validated_items.append({
            "item_input": item,
            "product": prod,
            "unit_price": unit_price,
            "discount": item_disc,
            "line_total": line_total
        })

    # 2. Customer resolution (match by phone or email, or create new record)
    c_name = (bill_data.customer_name or "").strip()
    c_phone = (bill_data.customer_phone or "").strip()
    c_email = (bill_data.customer_email or "").strip().lower()

    customer = None
    if c_phone and c_email:
        customer = db.query(Customer).filter(
            or_(Customer.phone == c_phone, func.lower(Customer.email) == c_email)
        ).first()
    elif c_phone:
        customer = db.query(Customer).filter(Customer.phone == c_phone).first()
    elif c_email:
        customer = db.query(Customer).filter(func.lower(Customer.email) == c_email).first()

    now = datetime.utcnow()

    if not customer:
        # Determine highest customer_id
        max_cust_id = db.query(func.max(Customer.customer_id)).scalar() or 20000
        new_cust_id = int(max_cust_id) + 1

        final_name = c_name if c_name else f"Customer {new_cust_id}"
        final_email = c_email if c_email else f"customer_{new_cust_id}@pos.store"
        final_phone = c_phone if c_phone else f"999{new_cust_id:07d}"

        customer = Customer(
            customer_id=new_cust_id,
            name=final_name,
            email=final_email,
            phone=final_phone,
            city=bill_data.city or "Local Store",
            state=bill_data.state or "Retail",
            segment="Retail",
            total_orders=0,
            total_spent=0.0,
            avg_order_value=0.0,
            first_purchase_date=now,
            last_purchase_date=now,
            created_at=now,
            updated_at=now
        )
        db.add(customer)
        db.flush()
    else:
        # Update customer contact details if provided
        if c_name and (not customer.name or customer.name == "Unknown"):
            customer.name = c_name
        if c_phone and not customer.phone:
            customer.phone = c_phone
        if c_email and not customer.email:
            customer.email = c_email

    # 3. Calculation of discounts, taxes, and grand totals
    overall_discount = min(subtotal, max(0.0, float(bill_data.discount_applied or 0.0)))
    taxable_amount = max(0.0, subtotal - overall_discount)
    tax_rate = max(0.0, float(bill_data.tax_rate or 0.0))
    tax_amount = round(taxable_amount * (tax_rate / 100.0), 2)
    grand_total = round(taxable_amount + tax_amount, 2)
    total_items = sum(v["item_input"].quantity for v in validated_items)

    # 4. Generate unique invoice number
    date_prefix = now.strftime("%Y%m%d")
    inv_number = None
    for _ in range(20):
        seq = random.randint(1000, 9999)
        candidate = f"INV-{date_prefix}-{seq}"
        if not db.query(models.Order).filter(models.Order.order_id == candidate).first():
            inv_number = candidate
            break
    if not inv_number:
        inv_number = f"INV-{date_prefix}-{int(now.timestamp())}"

    # 5. Automatically reduce product stock and update product totals
    for v in validated_items:
        prod = v["product"]
        qty = v["item_input"].quantity
        line_total = v["line_total"]
        prod.stock = max(0, int(prod.stock or 0) - qty)
        prod.total_quantity_sold = int(prod.total_quantity_sold or 0) + qty
        prod.total_revenue = round(float(prod.total_revenue or 0.0) + line_total, 2)

    # 6. Create Order record
    order = models.Order(
        order_id=inv_number,
        customer_id=customer.customer_id,
        order_date=now,
        state=bill_data.state or customer.state or "Retail",
        city=bill_data.city or customer.city or "Store Counter",
        subtotal=round(subtotal, 2),
        discount_applied=round(overall_discount, 2),
        tax_rate=tax_rate,
        tax_amount=round(tax_amount, 2),
        total_amount=grand_total,
        total_items=total_items,
        status="Completed",
        payment_method=bill_data.payment_method or "Cash",
        profit_estimate=round(grand_total * 0.25, 2),
        customer_name=customer.name,
        customer_phone=customer.phone,
        customer_email=customer.email,
        invoice_number=inv_number
    )
    db.add(order)
    db.flush()

    # 7. Create OrderItem records
    saved_items_resp = []
    for v in validated_items:
        prod = v["product"]
        qty = v["item_input"].quantity
        unit_price = v["unit_price"]
        disc = v["discount"]
        lt = v["line_total"]

        order_item = models.OrderItem(
            order_id=inv_number,
            stock_code=prod.stock_code,
            description=prod.description or v["item_input"].description or "Product",
            quantity=qty,
            unit_price=unit_price,
            discount=disc,
            line_total=lt,
            is_returned=False,
            product_id=prod.id
        )
        db.add(order_item)
        db.flush()

        saved_items_resp.append(schemas.BillItemResponse(
            id=order_item.id,
            stock_code=order_item.stock_code,
            description=order_item.description,
            quantity=order_item.quantity,
            unit_price=order_item.unit_price,
            discount=order_item.discount,
            line_total=order_item.line_total
        ))

    # 8. Record payment
    payment = models.Payment(
        order_id=inv_number,
        payment_method=bill_data.payment_method or "Cash",
        amount=grand_total,
        transaction_id=f"TXN-{date_prefix}-{random.randint(10000, 99999)}",
        payment_date=now,
        status="Completed"
    )
    db.add(payment)

    # 9. Update customer metrics
    customer.total_orders = int(customer.total_orders or 0) + 1
    customer.total_spent = round(float(customer.total_spent or 0.0) + grand_total, 2)
    customer.avg_order_value = round(customer.total_spent / customer.total_orders, 2)
    customer.last_purchase_date = now
    customer.updated_at = now

    db.commit()
    db.refresh(order)

    return schemas.BillInvoiceResponse(
        id=order.id,
        order_id=order.order_id,
        invoice_number=order.invoice_number,
        customer_id=customer.customer_id,
        customer_name=customer.name,
        customer_phone=customer.phone,
        customer_email=customer.email,
        order_date=order.order_date,
        state=order.state,
        city=order.city,
        subtotal=order.subtotal,
        discount_applied=order.discount_applied,
        tax_rate=order.tax_rate,
        tax_amount=order.tax_amount,
        total_amount=order.total_amount,
        total_items=order.total_items,
        payment_method=order.payment_method,
        status=order.status,
        items=saved_items_resp
    )

def get_invoices(db: Session, skip: int = 0, limit: int = 50, search: Optional[str] = None):
    """Retrieve billing invoices sorted by order date descending with search."""
    query = db.query(models.Order)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Order.order_id.ilike(search_term),
                models.Order.invoice_number.ilike(search_term),
                models.Order.customer_name.ilike(search_term),
                models.Order.customer_phone.ilike(search_term),
                models.Order.customer_email.ilike(search_term),
            )
        )

    total = query.count()
    orders = query.order_by(models.Order.order_date.desc()).offset(skip).limit(limit).all()

    invoices = []
    for ord in orders:
        items = db.query(models.OrderItem).filter(models.OrderItem.order_id == ord.order_id).all()
        item_list = [
            schemas.BillItemResponse(
                id=item.id,
                stock_code=item.stock_code,
                description=item.description,
                quantity=item.quantity,
                unit_price=float(item.unit_price or 0.0),
                discount=float(getattr(item, "discount", 0.0) or 0.0),
                line_total=float(item.line_total or 0.0)
            ) for item in items
        ]
        invoices.append(schemas.BillInvoiceResponse(
            id=ord.id,
            order_id=ord.order_id,
            invoice_number=ord.invoice_number or ord.order_id,
            customer_id=ord.customer_id,
            customer_name=ord.customer_name or f"Customer #{ord.customer_id}",
            customer_phone=ord.customer_phone,
            customer_email=ord.customer_email,
            order_date=ord.order_date,
            state=ord.state,
            city=ord.city,
            subtotal=float(ord.subtotal or ord.total_amount or 0.0),
            discount_applied=float(ord.discount_applied or 0.0),
            tax_rate=float(getattr(ord, "tax_rate", 0.0) or 0.0),
            tax_amount=float(getattr(ord, "tax_amount", 0.0) or 0.0),
            total_amount=float(ord.total_amount or 0.0),
            total_items=int(ord.total_items or 0),
            payment_method=ord.payment_method or "Cash",
            status=ord.status or "Completed",
            items=item_list
        ))

    return {
        "total": total,
        "page": (skip // limit) + 1 if limit else 1,
        "size": len(invoices),
        "invoices": invoices
    }

def get_invoice(db: Session, invoice_id: str):
    """Retrieve a single invoice with full line items."""
    ord = db.query(models.Order).filter(
        or_(models.Order.order_id == invoice_id, models.Order.invoice_number == invoice_id)
    ).first()
    if not ord:
        return None

    items = db.query(models.OrderItem).filter(models.OrderItem.order_id == ord.order_id).all()
    item_list = [
        schemas.BillItemResponse(
            id=item.id,
            stock_code=item.stock_code,
            description=item.description,
            quantity=item.quantity,
            unit_price=float(item.unit_price or 0.0),
            discount=float(getattr(item, "discount", 0.0) or 0.0),
            line_total=float(item.line_total or 0.0)
        ) for item in items
    ]
    return schemas.BillInvoiceResponse(
        id=ord.id,
        order_id=ord.order_id,
        invoice_number=ord.invoice_number or ord.order_id,
        customer_id=ord.customer_id,
        customer_name=ord.customer_name or f"Customer #{ord.customer_id}",
        customer_phone=ord.customer_phone,
        customer_email=ord.customer_email,
        order_date=ord.order_date,
        state=ord.state,
        city=ord.city,
        subtotal=float(ord.subtotal or ord.total_amount or 0.0),
        discount_applied=float(ord.discount_applied or 0.0),
        tax_rate=float(getattr(ord, "tax_rate", 0.0) or 0.0),
        tax_amount=float(getattr(ord, "tax_amount", 0.0) or 0.0),
        total_amount=float(ord.total_amount or 0.0),
        total_items=int(ord.total_items or 0),
        payment_method=ord.payment_method or "Cash",
        status=ord.status or "Completed",
        items=item_list
    )
