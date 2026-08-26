"""
Analytics Router — ML Model Prediction Endpoints
===================================================
Exposes the trained DQN model for discount optimization predictions.
"""

from fastapi import APIRouter, Depends

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
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Given a sale's features (category, segment, region, quantity, sales amount),
    returns the AI-recommended discount level and confidence scores.
    
    The model uses a trained Deep Q-Network to find the discount that
    maximizes estimated profit.
    """
    result = model.predict_discount(payload.model_dump())
    return PredictResponse(**result)


@router.post(
    "/batch-predict",
    response_model=BatchPredictResponse,
    summary="Predict optimal discounts for multiple sales",
)
def batch_predict(
    payload: BatchPredictRequest,
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Batch prediction endpoint — accepts up to 500 records at once.
    Returns a list of discount recommendations.
    """
    records = [r.model_dump() for r in payload.records]
    predictions = model.batch_predict(records)

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
    _user: User = Depends(get_current_user),
    model: ModelService = Depends(get_model_service),
):
    """
    Returns the model's evaluation metrics from the latest training run:
    profit improvement, positive profit rate, per-category breakdown, etc.
    """
    summary = model.get_evaluation_summary()
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
