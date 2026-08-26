from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth.router import get_current_user
from backend.auth.models import User
from backend.ingestion.models import DocumentAnalysis

router = APIRouter(prefix="/api/powerbi", tags=["powerbi"])

@router.get("/dataset")
def get_powerbi_dataset(
    db: Session = Depends(get_db),
    # Optional: in a real enterprise app, PowerBI might authenticate via an API key, 
    # but we'll use the standard JWT dependency for now.
    current_user: User = Depends(get_current_user)
):
    """
    Exposes all analyzed document insights as a flattened dataset optimized for Power BI.
    """
    docs = db.query(DocumentAnalysis).filter(DocumentAnalysis.user_id == current_user.id).all()
    
    dataset = []
    for doc in docs:
        insights = doc.structured_insights or {}
        
        # Flatten the data structure for Power BI tabular format
        row = {
            "document_id": doc.id,
            "filename": doc.filename,
            "upload_date": doc.created_at.isoformat(),
            "summary": insights.get("summary", ""),
            "sentiment": insights.get("sentiment", "Neutral"),
        }
        
        # Add dynamic metrics as columns (assuming they are numeric or simple strings)
        metrics = insights.get("key_metrics", {})
        for metric_name, metric_value in metrics.items():
            # PowerBI prefers safe column names, but we'll pass them as-is
            row[f"metric_{metric_name.replace(' ', '_').lower()}"] = metric_value
            
        dataset.append(row)
        
    return {
        "dataset_name": "Enterprise Document Insights",
        "total_records": len(dataset),
        "rows": dataset
    }
