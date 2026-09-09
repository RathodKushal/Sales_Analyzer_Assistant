from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    email: EmailStr
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
    state: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    customer_id: int
    segment: str
    total_orders: int
    total_spent: float
    avg_order_value: float
    return_rate: float
    first_purchase_date: Optional[datetime]
    last_purchase_date: Optional[datetime]
    lifetime_value: float
    churn_risk_score: float
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

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
