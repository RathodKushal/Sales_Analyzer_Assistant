from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from . import schemas, service

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("/", response_model=List[schemas.SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    """List all registered purchasing vendors / suppliers."""
    return service.get_suppliers(db)

@router.post("/", response_model=schemas.SupplierResponse)
def create_supplier(data: schemas.SupplierCreate, db: Session = Depends(get_db)):
    """Create a new purchasing vendor / supplier."""
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Supplier name is required")
    return service.create_supplier(db, data)
