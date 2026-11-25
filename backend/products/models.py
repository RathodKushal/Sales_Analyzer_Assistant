from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from backend.database import Base
from datetime import datetime

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    stock_code = Column(String(50), unique=True, index=True)
    description = Column(String(200))
    category = Column(String(100), default="Unknown")
    
    avg_price = Column(Float, default=0.0)
    total_quantity_sold = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    
    return_rate = Column(Float, default=0.0)
    popularity_rank = Column(Integer, default=0)

    # Inventory & Vendor Fields
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    stock = Column(Integer, default=0)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    approval_status = Column(String(50), default="active")  # 'active' or 'pending_approval'

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    description = Column(String(200))
    parent_category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    manufacturer = Column(String(100))
    country_of_origin = Column(String(50))

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    warehouse_location = Column(String(100))
    stock_level = Column(Integer, default=0)
    reorder_threshold = Column(Integer, default=10)
    last_restock_date = Column(DateTime)

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_info = Column(String(255), nullable=True)
    rating = Column(Float, default=5.0)

class RestockRequest(Base):
    __tablename__ = "restock_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_type = Column(String(50), default="restock")  # "restock" or "new_product"
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(200))
    sku = Column(String(50))
    requested_quantity = Column(Integer, default=0)
    current_stock = Column(Integer, default=0)
    unit_price = Column(Float, default=0.0)
    
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier_name = Column(String(150), nullable=True)
    
    # Lifecycle:
    # 'pending_purchase_approval' -> 'ordered_to_manufacturer' -> 'accepted_by_manufacturer' -> 'shipped_to_purchase' -> 'received_and_restocked' (or 'rejected')
    status = Column(String(50), default="pending_purchase_approval")
    priority = Column(String(20), default="normal")  # "urgent", "high", "normal", "low"
    notes = Column(String(500), nullable=True)
    po_number = Column(String(100), nullable=True)
    
    # Return back statement from PO Manager when moving stock into Inventory
    return_back_statement = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
