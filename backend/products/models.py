from sqlalchemy import Column, Integer, String, Float
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
