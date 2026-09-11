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


@router.post("/upload-sales-dataset")
async def upload_sales_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a single CSV or Excel sales dataset.
    Normalizes headers, handles missing columns with '-', updates DB,
    and retrains the sales forecaster & demand models.
    """
    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only CSV (.csv) or Excel (.xlsx, .xls) files are allowed.")

    temp_filename = f"temp_upload_{file.filename}"
    try:
        content = await file.read()
        with open(temp_filename, "wb") as f:
            f.write(content)

        from .dataset_parser import parse_and_import_single_dataset
        from backend.analytics.service import ModelService

        # 1. Parse and import dataset
        stats = parse_and_import_single_dataset(temp_filename, db)

        # 2. Retrain ML models on the new dataset
        try:
            model_service = ModelService.get_instance()
            model_service.retrain_models()
            stats["models_retrained"] = True
        except Exception as e:
            stats["models_retrained"] = False
            stats["model_error"] = str(e)

        return stats

    except ValueError as val_err:
        err_str = str(val_err)
        try:
            import json
            err_json = json.loads(err_str)
            raise HTTPException(status_code=400, detail=err_json)
        except Exception:
            raise HTTPException(status_code=400, detail=err_str)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process sales dataset: {str(e)}")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)


@router.get("/dataset-status")
def get_dataset_status(
    current_user: User = Depends(get_current_user)
):
    """Return status, metrics availability, and info about the currently active sales dataset."""
    from pathlib import Path
    import json

    project_root = Path(__file__).resolve().parent.parent.parent
    data_dir = project_root / "data"
    master_path = data_dir / "uploaded_sales_dataset.csv"
    meta_path = data_dir / "dataset_metadata.json"

    if not master_path.exists():
        return {
            "has_dataset": False,
            "message": "No active dataset. System is in zero/null state.",
            "total_rows": 0,
            "total_revenue": 0.0,
            "total_orders": 0,
            "total_customers": 0,
            "total_products": 0,
            "available_metrics": {
                "revenue": False,
                "orders": False,
                "avg_order_value": False,
                "products": False,
                "categories": False,
                "customers": False,
                "returns": False,
                "profit": False,
                "location": False,
            },
            "missing_tooltips": {
                "returns": "This data not mentioned in the dataset",
                "customers": "This data not mentioned in the dataset",
                "customer_segments": "This data not mentioned in the dataset",
                "categories": "This data not mentioned in the dataset",
                "profit": "This data not mentioned in the dataset",
                "location": "This data not mentioned in the dataset",
            },
        }

    if meta_path.exists():
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    # Fallback if metadata json missing but master CSV exists
    try:
        import pandas as pd
        df = pd.read_csv(master_path)
        has_cat = "Category" in df.columns and not (df["Category"] == "-").all()
        has_cust = "CustomerID" in df.columns and not (df["CustomerID"] == "-").all()
        return {
            "has_dataset": True,
            "file_name": "uploaded_sales_dataset.csv",
            "total_rows": len(df),
            "total_revenue": float(df["TotalAmount"].sum()) if "TotalAmount" in df.columns else 0.0,
            "total_orders": df["OrderID"].nunique() if "OrderID" in df.columns else len(df),
            "total_products": df["StockCode"].nunique() if "StockCode" in df.columns else len(df),
            "categories_found": sorted([c for c in df["Category"].unique().tolist() if c != "-"]) if has_cat else [],
            "available_metrics": {
                "revenue": "TotalAmount" in df.columns,
                "orders": True,
                "avg_order_value": True,
                "products": True,
                "categories": has_cat,
                "customers": has_cust,
                "returns": False,
                "profit": "Profit" in df.columns and df["Profit"].notna().any(),
                "location": "Country" in df.columns and not (df["Country"] == "-").all(),
            },
            "missing_tooltips": {
                "returns": "This data not mentioned in the dataset",
                "customers": "This data not mentioned in the dataset",
                "customer_segments": "This data not mentioned in the dataset",
                "categories": "This data not mentioned in the dataset",
                "profit": "This data not mentioned in the dataset",
                "location": "This data not mentioned in the dataset",
            },
        }
    except Exception as e:
        return {"has_dataset": False, "error": str(e)}


@router.post("/reset-dataset")
def reset_dataset(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reset all data to 0/null: deletes uploaded dataset and empties business database tables.
    """
    from .dataset_parser import clear_active_dataset
    from backend.analytics.service import ModelService

    result = clear_active_dataset(db)
    
    # Reset in-memory model caches
    try:
        model_service = ModelService.get_instance()
        model_service.forecaster = None
        model_service.hype_results = {"product_predictions": {}}
    except Exception as e:
        print(f"[ResetDataset] Note: {e}")

    return result


@router.get("/sample-template")
def download_sample_template():
    """Returns a sample CSV template content with standard columns."""
    from fastapi.responses import PlainTextResponse

    csv_content = (
        "OrderDate,StockCode,ProductName,Category,Quantity,UnitPrice,TotalAmount,CustomerID,Country\n"
        "2024-01-15,SKU-1001,Wireless Ergonomic Mouse,Electronics,2,1499.00,2998.00,CUST-501,India\n"
        "2024-01-16,SKU-1002,Mechanical RGB Keyboard,Electronics,1,3999.00,3999.00,CUST-502,India\n"
        "2024-01-18,SKU-2001,Cotton Casual T-Shirt,Fashion,3,799.00,2397.00,CUST-503,India\n"
        "2024-02-01,SKU-3001,Stainless Steel Water Bottle,-,2,499.00,998.00,-,India\n"
        "2024-02-10,SKU-4001,Ceramic Coffee Mug,-,4,299.00,1196.00,-,-\n"
    )
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_dataset_sample.csv"}
    )

