from pydantic import BaseModel
from typing import List
from datetime import datetime

class ReturnBase(BaseModel):
    order_id: str
    customer_id: int
    return_reason: str
    refund_amount: float
    return_status: str
    return_date: datetime

class ReturnResponse(ReturnBase):
    id: int

    class Config:
        from_attributes = True

class ReturnListResponse(BaseModel):
    total: int
    page: int
    size: int
    returns: List[ReturnResponse]
