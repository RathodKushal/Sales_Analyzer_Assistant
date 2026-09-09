from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from backend.database import Base
from datetime import datetime

class ReturnRecord(Base):
    __tablename__ = "returns"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.order_id"), index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), index=True)
    
    return_reason = Column(String(200))
    refund_amount = Column(Float, default=0.0)
    return_status = Column(String(50), default="Pending")
    return_date = Column(DateTime, default=datetime.utcnow)
