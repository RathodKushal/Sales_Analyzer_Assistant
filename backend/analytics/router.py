"""
Analytics Router — ML Model Prediction Endpoints
===================================================
Exposes the trained DQN model for discount optimization predictions,
sales forecasting, and demand analysis.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth.models import User
from backend.auth.utils import get_current_user
from backend.analytics.service import ModelService
from backend.analytics.schemas import (
    PredictRequest,
    PredictResponse,
    BatchPredictRequest,
    BatchPredictResponse,
    ModelSummaryResponse,
    DiscountBinsResponse,
    ForecastResponse,
    DemandAnalysisResponse,
    CategoryTrendResponse,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Predictions"])


def get_model_service() -> ModelService:
    """FastAPI dependency — returns the singleton ModelService."""
    return ModelService.get_instance()


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Predict optimal discount for a single sale",
)
def predict_discount(
    payload: PredictRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Given a sale's features (category, segment, region, quantity, sales amount),
    returns the AI-recommended discount level and confidence scores.
    
    The model uses a trained Deep Q-Network to find the discount that
    maximizes estimated profit.
    """
    result = model.predict_discount(payload.model_dump(), db=db)
    return PredictResponse(**result)


@router.post(
    "/batch-predict",
    response_model=BatchPredictResponse,
    summary="Predict optimal discounts for multiple sales",
)
def batch_predict(
    payload: BatchPredictRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Batch prediction endpoint — accepts up to 500 records at once.
    Returns a list of discount recommendations.
    """
    records = [r.model_dump() for r in payload.records]
    predictions = model.batch_predict(records, db=db)

    return BatchPredictResponse(
        predictions=[PredictResponse(**p) for p in predictions],
        total_records=len(predictions),
    )


@router.get(
    "/summary",
    response_model=ModelSummaryResponse,
    summary="Get model evaluation summary",
)
def get_model_summary(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Returns the model's evaluation metrics from the latest training run:
    profit improvement, positive profit rate, per-category breakdown, etc.
    """
    summary = model.get_evaluation_summary(db=db)
    return ModelSummaryResponse(**summary)


@router.get(
    "/discount-bins",
    response_model=DiscountBinsResponse,
    summary="Get available discount levels",
)
def get_discount_bins(
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """Returns the discrete discount levels the model can recommend."""
    return DiscountBinsResponse(**model.get_discount_bins())


@router.get(
    "/dataset-meta",
    summary="Get active dataset categories, segments, and regions for AI forms",
)
def get_dataset_meta(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """Returns categories, segments, states, and active items from live billing database."""
    return model.get_dataset_meta(db=db)



@router.get(
    "/hype-products",
    summary="Get list of products with hype predictions",
)
def get_hype_products(
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None, description="Search stock code or product name"),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Returns a list of products with pre-computed hype predictions from live sales.
    """
    return model.get_hype_products(limit=limit, search=search, db=db)


@router.get(
    "/hype/{stock_code}",
    summary="Get product hype prediction",
)
def get_product_hype(
    stock_code: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Returns the RL agent's hype prediction for a given product from live sales.
    """
    try:
        return model.get_hype_prediction(stock_code, db=db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Forecast & Demand Endpoints ─────────────────────────────


@router.get(
    "/forecast",
    summary="Forecast future sales revenue",
)
def forecast_sales(
    months: int = Query(6, ge=1, le=24, description="Forecast horizon in months"),
    category: Optional[str] = Query(None, description="Filter by category name"),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Generate future sales revenue forecasts reading live from billing & orders data.
    Uses Facebook Prophet when history is >=4 months, with an intelligent
    moving-average baseline fallback for recent store data.
    """
    try:
        return model.forecast_sales(
            horizon_months=months,
            category=category,
            db=db,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/demand-analysis",
    summary="Get comprehensive demand analysis",
)
def get_demand_analysis(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Returns a comprehensive demand analysis combining:
    - Product-level demand signals (from Hype RL model)
    - Category-level revenue forecasts (from Prophet)
    - Seasonal demand patterns
    - Top rising/declining products
    - Actionable recommendations
    """
    try:
        return model.get_demand_analysis(db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/category-trends",
    summary="Get category-level revenue trends",
)
def get_category_trends(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Returns historical and predicted monthly revenue trends per category.
    """
    try:
        return model.get_category_trends(db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

