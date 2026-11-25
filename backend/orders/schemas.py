from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class OrderItemBase(BaseModel):
    stock_code: str
    description: str
    quantity: int
    unit_price: float
    line_total: float
    is_returned: bool
    discount: Optional[float] = 0.0
    product_id: Optional[int] = None

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: str

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    order_id: str
    customer_id: int
    order_date: datetime
    state: Optional[str] = None
    city: Optional[str] = None
    total_amount: float
    total_items: int
    status: str
    discount_applied: float
    payment_method: str
    profit_estimate: float
    subtotal: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    tax_rate: Optional[float] = 0.0
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    invoice_number: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    items: Optional[List[OrderItemResponse]] = []

    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    total: int
    page: int
    size: int
    orders: List[OrderResponse]

# ── Billing / POS Schemas ──────────────────────────────────────────

class BillItemCreate(BaseModel):
    product_id: Optional[int] = None
    stock_code: str
    description: Optional[str] = None
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")
    unit_price: float = Field(..., ge=0, description="Unit price")
    discount: Optional[float] = Field(0.0, ge=0, description="Discount amount on line item")

class BillCreateRequest(BaseModel):
    customer_name: str = Field(..., min_length=1, description="Customer name")
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    city: Optional[str] = "Store Counter"
    state: Optional[str] = "Retail"
    items: List[BillItemCreate] = Field(..., min_items=1, description="List of items to bill")
    payment_method: str = Field("Cash", description="Cash, UPI, Credit Card, Debit Card, Net Banking")
    discount_applied: Optional[float] = Field(0.0, ge=0, description="Overall bill discount")
    tax_rate: Optional[float] = Field(0.0, ge=0, description="Tax / GST percentage")
    notes: Optional[str] = None

class BillItemResponse(BaseModel):
    id: Optional[int] = None
    stock_code: str
    description: str
    quantity: int
    unit_price: float
    discount: float = 0.0
    line_total: float

    class Config:
        from_attributes = True

class BillInvoiceResponse(BaseModel):
    id: Optional[int] = None
    order_id: str
    invoice_number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    order_date: datetime
    state: Optional[str] = None
    city: Optional[str] = None
    subtotal: float
    discount_applied: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    total_items: int
    payment_method: str
    status: str
    items: List[BillItemResponse] = []

    class Config:
        from_attributes = True

class InvoiceListResponse(BaseModel):
    total: int
    page: int
    size: int
    invoices: List[BillInvoiceResponse]
