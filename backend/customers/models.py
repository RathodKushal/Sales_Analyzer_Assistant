from sqlalchemy import Column, Integer, String, Float, DateTime
from backend.database import Base
from datetime import datetime

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, unique=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20))
    gender = Column(String(20))
    age = Column(Integer)
    state = Column(String(100))
    city = Column(String(100))
    pincode = Column(String(20))
    
    # Computed CRM fields
    segment = Column(String(50), default="Unknown")
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    avg_order_value = Column(Float, default=0.0)
    return_rate = Column(Float, default=0.0)
    
    first_purchase_date = Column(DateTime, nullable=True)
    last_purchase_date = Column(DateTime, nullable=True)
    
    lifetime_value = Column(Float, default=0.0)
    churn_risk_score = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
