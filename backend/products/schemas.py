from pydantic import BaseModel
from typing import List

class ProductBase(BaseModel):
    stock_code: str
    description: str
    category: str
    avg_price: float
    total_quantity_sold: int
    total_revenue: float
    return_rate: float
    popularity_rank: int

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    total: int
    page: int
    size: int
    products: List[ProductResponse]
