from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    state: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None

class CustomerCreate(CustomerBase):
    customer_id: int

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    customer_id: int
    segment: Optional[str] = "Retail"
    total_orders: int = 0
    total_spent: float = 0.0
    avg_order_value: float = 0.0
    return_rate: float = 0.0
    first_purchase_date: Optional[datetime] = None
    last_purchase_date: Optional[datetime] = None
    lifetime_value: float = 0.0
    churn_risk_score: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerSegmentStats(BaseModel):
    segment: str
    count: int
    avg_ltv: float
    avg_return_rate: float

class CustomerListResponse(BaseModel):
    total: int
    page: int
    size: int
    customers: List[CustomerResponse]
