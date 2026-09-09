from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrderItemBase(BaseModel):
    stock_code: str
    description: str
    quantity: int
    unit_price: float
    line_total: float
    is_returned: bool

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: str

    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    order_id: str
    customer_id: int
    order_date: datetime
    state: str
    city: str
    total_amount: float
    total_items: int
    status: str
    discount_applied: float
    payment_method: str
    profit_estimate: float

class OrderResponse(OrderBase):
    id: int
    items: Optional[List[OrderItemResponse]] = []

    class Config:
        orm_mode = True

class OrderListResponse(BaseModel):
    total: int
    page: int
    size: int
    orders: List[OrderResponse]
