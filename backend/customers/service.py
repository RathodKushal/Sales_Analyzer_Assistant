from sqlalchemy.orm import Session
from sqlalchemy import or_
from . import models, schemas
from typing import List, Optional

def get_customers(db: Session, skip: int = 0, limit: int = 50, segment: Optional[str] = None, state: Optional[str] = None, search: Optional[str] = None):
    query = db.query(models.Customer)
    
    if segment:
        query = query.filter(models.Customer.segment == segment)
    if state:
        query = query.filter(models.Customer.state == state)
    if search:
        query = query.filter(or_(
            models.Customer.name.ilike(f"%{search}%"),
            models.Customer.email.ilike(f"%{search}%")
        ))
        
    total = query.count()
    customers = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "size": len(customers),
        "customers": customers
    }

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.customer_id == customer_id).first()

def get_customer_stats(db: Session):
    from sqlalchemy import func
    
    stats = db.query(
        models.Customer.segment,
        func.count(models.Customer.id).label('count'),
        func.avg(models.Customer.lifetime_value).label('avg_ltv'),
        func.avg(models.Customer.return_rate).label('avg_return_rate')
    ).group_by(models.Customer.segment).all()
    
    return [
        {
            "segment": s.segment,
            "count": s.count,
            "avg_ltv": s.avg_ltv or 0.0,
            "avg_return_rate": s.avg_return_rate or 0.0
        } for s in stats
    ]
