from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from backend.database import Base

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
    contact_email = Column(String(100))
    contact_phone = Column(String(20))
    rating = Column(Float, default=0.0)
