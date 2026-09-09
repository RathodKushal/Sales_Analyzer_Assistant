from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from typing import Optional

def get_products(db: Session, skip: int = 0, limit: int = 50, category: Optional[str] = None):
    query = db.query(models.Product)
    
    if category:
        query = query.filter(models.Product.category == category)
        
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "size": len(products),
        "products": products
    }

def get_product(db: Session, stock_code: str):
    return db.query(models.Product).filter(models.Product.stock_code == stock_code).first()

def get_top_sellers(db: Session, limit: int = 10):
    return db.query(models.Product).order_by(models.Product.total_quantity_sold.desc()).limit(limit).all()
