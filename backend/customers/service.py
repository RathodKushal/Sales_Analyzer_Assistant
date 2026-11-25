from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from . import models, schemas
from backend.orders.models import Order
from typing import List, Optional

def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    segment: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None
):
    """
    Get customer list built ONLY from customers who have actually purchased
    something through the billing system (orders with invoice_number and total_orders > 0).
    Customers with no purchases or dummy/seeded records will never appear.
    """
    billing_customers_query = db.query(Order.customer_id).filter(Order.invoice_number.isnot(None))

    query = db.query(models.Customer).filter(
        models.Customer.customer_id.in_(billing_customers_query),
        models.Customer.total_orders > 0
    )

    if segment:
        query = query.filter(models.Customer.segment == segment)
    if state:
        query = query.filter(models.Customer.state == state)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Customer.name.ilike(search_term),
                models.Customer.phone.ilike(search_term),
                models.Customer.email.ilike(search_term),
                models.Customer.city.ilike(search_term),
                models.Customer.state.ilike(search_term)
            )
        )

    total = query.count()
    customers = query.order_by(
        models.Customer.last_purchase_date.desc(),
        models.Customer.id.desc()
    ).offset(skip).limit(limit).all()

    return {
        "total": total,
        "page": (skip // limit) + 1 if limit else 1,
        "size": len(customers),
        "customers": customers
    }

def get_customer(db: Session, customer_id: int):
    """Get single customer profile, verifying they have active billing purchases."""
    billing_customers_query = db.query(Order.customer_id).filter(Order.invoice_number.isnot(None))

    return db.query(models.Customer).filter(
        models.Customer.customer_id == customer_id,
        models.Customer.customer_id.in_(billing_customers_query),
        models.Customer.total_orders > 0
    ).first()

def get_customer_stats(db: Session):
    """Segment breakdown for customers who have actually purchased through billing."""
    billing_customers_query = db.query(Order.customer_id).filter(Order.invoice_number.isnot(None))

    stats = db.query(
        models.Customer.segment,
        func.count(models.Customer.id).label('count'),
        func.avg(models.Customer.total_spent).label('avg_spent'),
        func.avg(models.Customer.total_orders).label('avg_orders')
    ).filter(
        models.Customer.customer_id.in_(billing_customers_query),
        models.Customer.total_orders > 0
    ).group_by(models.Customer.segment).all()

    return [
        {
            "segment": s.segment or "Retail",
            "count": s.count,
            "avg_ltv": float(s.avg_spent or 0.0),
            "avg_return_rate": 0.0
        } for s in stats
    ]
