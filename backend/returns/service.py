from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from typing import Optional

def get_returns(db: Session, skip: int = 0, limit: int = 50, status: Optional[str] = None):
    query = db.query(models.ReturnRecord)
    
    if status:
        query = query.filter(models.ReturnRecord.return_status == status)
        
    total = query.count()
    returns = query.order_by(models.ReturnRecord.return_date.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "size": len(returns),
        "returns": returns
    }

def get_return_stats(db: Session):
    total_returns = db.query(models.ReturnRecord).count()
    total_refunds = db.query(func.sum(models.ReturnRecord.refund_amount)).scalar() or 0.0
    
    # Reasons breakdown
    reasons = db.query(
        models.ReturnRecord.return_reason,
        func.count(models.ReturnRecord.id).label('count')
    ).group_by(models.ReturnRecord.return_reason).all()
    
    return {
        "total_returns": total_returns,
        "total_refunds": total_refunds,
        "reasons": [{"reason": r.return_reason, "count": r.count} for r in reasons]
    }
