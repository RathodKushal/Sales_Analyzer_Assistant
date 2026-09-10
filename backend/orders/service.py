from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from typing import Optional

def get_orders(db: Session, skip: int = 0, limit: int = 50, customer_id: Optional[int] = None, status: Optional[str] = None):
    query = db.query(models.Order)
    
    if customer_id:
        query = query.filter(models.Order.customer_id == customer_id)
    if status:
        query = query.filter(models.Order.status == status)
        
    total = query.count()
    orders = query.order_by(models.Order.order_date.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "size": len(orders),
        "orders": orders
    }

def get_order(db: Session, order_id: str):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if order:
        order.items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()
    return order

def get_order_stats(db: Session):
    total_orders = db.query(models.Order).count()
    total_revenue = db.query(func.sum(models.Order.total_amount)).scalar() or 0.0
    avg_order_value = (total_revenue / total_orders) if total_orders > 0 else 0.0
    
    # Revenue by state
    state_revenue = db.query(
        models.Order.state,
        func.sum(models.Order.total_amount).label('revenue')
    ).group_by(models.Order.state).order_by(func.sum(models.Order.total_amount).desc()).limit(5).all()
    
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "average_order_value": avg_order_value,
        "top_states": [{"state": s.state, "revenue": s.revenue} for s in state_revenue if s.state and s.state != "-"]
    }

