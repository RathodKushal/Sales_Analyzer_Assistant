"""
Sales Record Model — SQLAlchemy ORM
======================================
Mirrors the SALES.xlsx columns for persistent storage.
"""

from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from backend.database import Base


class SalesRecord(Base):
    """A single sales transaction record."""

    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, default=1)

    # Order identifiers
    order_id = Column(String(50), index=True, nullable=True)
    order_date = Column(Date, nullable=False)
    ship_date = Column(Date, nullable=True)

    # Categorization
    ship_mode = Column(String(30), nullable=True)
    segment = Column(String(30), nullable=False)
    region = Column(String(30), nullable=False)
    category = Column(String(30), nullable=False)
    sub_category = Column(String(30), nullable=False)

    # Financial metrics
    sales = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    profit = Column(Float, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return (
            f"<SalesRecord(id={self.id}, order_id='{self.order_id}', "
            f"category='{self.category}', sales={self.sales}, profit={self.profit})>"
        )
