from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import os

from backend.auth.router import get_current_user
from backend.auth.models import User
from backend.database import get_db
from .service import process_and_save_document
from .schemas import DocumentAnalysisResponse

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])

@router.post("/upload", response_model=DocumentAnalysisResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a PDF document. The system will parse it and use Gemini to extract structured insights.
    """
    valid_extensions = ('.pdf', '.csv', '.xls', '.xlsx')
    if not file.filename.lower().endswith(valid_extensions):
        raise HTTPException(status_code=400, detail="Only PDF, CSV, and Excel files are currently supported for dynamic analysis.")

    # Save file temporarily and also keep a persistent copy for reports
    temp_path = f"temp_{file.filename}"
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    persistent_path = os.path.join(upload_dir, file.filename)
    
    try:
        content = await file.read()
        
        # Write temp file for processing
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        # Keep a persistent copy for report chart generation
        with open(persistent_path, "wb") as buffer:
            buffer.write(content)
        
        # Process the document
        doc = process_and_save_document(db, temp_path, file.filename, current_user.id)
        
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file only
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/history")
def get_document_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all previously analyzed documents for the user."""
    from .models import DocumentAnalysis
    docs = db.query(DocumentAnalysis).filter(DocumentAnalysis.user_id == current_user.id).order_by(DocumentAnalysis.created_at.desc()).all()
    return docs
