from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from backend.database import Base
from datetime import datetime

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), index=True)
    order_date = Column(DateTime, default=datetime.utcnow)
    state = Column(String(100))
    city = Column(String(100))
    
    total_amount = Column(Float, default=0.0)
    total_items = Column(Integer, default=0)
    
    status = Column(String(50), default="Completed")
    discount_applied = Column(Float, default=0.0)
    payment_method = Column(String(50), default="Unknown")
    profit_estimate = Column(Float, default=0.0)

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.order_id"), index=True)
    stock_code = Column(String(50), index=True)
    description = Column(String(200))
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    line_total = Column(Float, default=0.0)
    is_returned = Column(Boolean, default=False)

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.order_id"), index=True)
    payment_method = Column(String(50))
    amount = Column(Float)
    transaction_id = Column(String(100), unique=True, nullable=True)
    payment_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="Completed")

class ShippingMethod(Base):
    __tablename__ = "shipping_methods"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    cost = Column(Float, default=0.0)
    estimated_days = Column(Integer)

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.order_id"), index=True)
    shipping_method_id = Column(Integer, ForeignKey("shipping_methods.id"))
    tracking_number = Column(String(100), nullable=True)
    status = Column(String(50), default="Pending")
    shipped_date = Column(DateTime, nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
