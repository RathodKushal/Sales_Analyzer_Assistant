from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class DocumentAnalysisResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    structured_insights: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PowerBIDatasetResponse(BaseModel):
    dataset_name: str
    rows: list[Dict[str, Any]]
    total_records: int
