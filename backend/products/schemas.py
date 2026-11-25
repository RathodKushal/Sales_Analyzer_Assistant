from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    stock_code: str
    description: str
    category: Optional[str] = "General"
    avg_price: float = 0.0
    total_quantity_sold: int = 0
    total_revenue: float = 0.0
    return_rate: float = 0.0
    popularity_rank: int = 0
    stock: int = 0
    supplier_id: Optional[int] = None
    is_deleted: bool = False
    approval_status: Optional[str] = "active"

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    total: int
    page: int
    size: int
    products: List[ProductResponse]

class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    stock: int = 0
    supplier_id: Optional[int] = None
    request_approval: Optional[bool] = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    supplier_id: Optional[int] = None
    approval_status: Optional[str] = None

class InventoryItemResponse(BaseModel):
    id: int
    name: str
    sku: str
    price: float
    stock: int
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    is_deleted: bool = False
    approval_status: Optional[str] = "active"

class SupplierCreate(BaseModel):
    name: str
    contact_info: Optional[str] = None

class SupplierResponse(BaseModel):
    id: int
    name: str
    contact_info: Optional[str] = None
    rating: float = 5.0

    class Config:
        from_attributes = True

# ── Restock & Procurement Workflow Schemas ─────────────────────

class RestockRequestCreate(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    sku: str
    requested_quantity: int
    supplier_id: Optional[int] = None
    priority: Optional[str] = "normal"
    notes: Optional[str] = None
    request_type: Optional[str] = "restock"  # "restock" or "new_product"

class RestockStatusUpdate(BaseModel):
    status: str
    po_number: Optional[str] = None
    return_back_statement: Optional[str] = None
    notes: Optional[str] = None

class RestockRequestResponse(BaseModel):
    id: int
    request_type: str
    product_id: Optional[int] = None
    product_name: str
    sku: str
    requested_quantity: int
    current_stock: int
    unit_price: float
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    status: str
    priority: str
    notes: Optional[str] = None
    po_number: Optional[str] = None
    return_back_statement: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
