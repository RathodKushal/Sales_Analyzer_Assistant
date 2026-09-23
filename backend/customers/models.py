from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
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

class Address(Base):
    __tablename__ = "addresses"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), index=True)
    address_line_1 = Column(String(255))
    address_line_2 = Column(String(255), nullable=True)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(20))
    is_default = Column(Boolean, default=False)

class Wishlist(Base):
    __tablename__ = "wishlists"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    added_date = Column(DateTime, default=datetime.utcnow)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    rating = Column(Integer)
    review_text = Column(Text, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    quantity = Column(Integer, default=1)
    added_date = Column(DateTime, default=datetime.utcnow)
