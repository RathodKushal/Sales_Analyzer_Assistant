"""
Analytics Schemas — Pydantic Models
======================================
Request and response schemas for the ML prediction endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Request Schemas ──────────────────────────────────────────

class PredictRequest(BaseModel):
    """
    Input features for a single discount prediction.
    
    These match the columns from SALES.xlsx that the model was trained on.
    """
    ship_mode: str = Field(..., examples=["Standard Class"])
    segment: str = Field(..., examples=["Consumer"])
    region: str = Field(..., examples=["West"])
    category: str = Field(..., examples=["Technology"])
    sub_category: str = Field(..., examples=["Phones"])
    quantity: int = Field(..., ge=1, examples=[3])
    sales: float = Field(..., gt=0, examples=[249.99])
    discount: float = Field(
        default=0.0, ge=0, le=1,
        description="Current/proposed discount (0.0 to 1.0). Used to compute Base_Sales.",
        examples=[0.2],
    )
    order_month: Optional[int] = Field(default=6, ge=1, le=12, examples=[6])
    order_day_of_week: Optional[int] = Field(default=2, ge=0, le=6, examples=[2])
    order_quarter: Optional[int] = Field(default=2, ge=1, le=4, examples=[2])
    ship_days: Optional[int] = Field(default=4, ge=0, examples=[4])


class BatchPredictRequest(BaseModel):
    """Batch prediction input — a list of individual records."""
    records: list[PredictRequest] = Field(..., min_length=1, max_length=500)


# ── Response Schemas ─────────────────────────────────────────

class PredictResponse(BaseModel):
    """Response for a single discount prediction."""
    recommended_discount: float = Field(
        ..., description="The recommended discount level (e.g., 0.1 = 10%)"
    )
    recommended_discount_bin: int = Field(
        ..., description="Index of the recommended discount bin"
    )
    confidence: float = Field(
        ..., description="Confidence score (max Q-value)"
    )
    q_values: dict[str, float] = Field(
        ..., description="Q-values for each discount level"
    )
    all_discount_options: list[float] = Field(
        ..., description="All available discount levels"
    )


class BatchPredictResponse(BaseModel):
    """Response for batch predictions."""
    predictions: list[PredictResponse]
    total_records: int


class ModelSummaryResponse(BaseModel):
    """Response for the model evaluation summary."""
    profit_improvement_pct: float
    total_historical_profit: float
    total_agent_estimated_profit: float
    mean_historical_reward: float
    mean_agent_estimated_reward: float
    historical_positive_profit_rate: float
    agent_positive_profit_rate: float
    action_agreement_rate: float
    per_category: Optional[dict] = None
    agent_discount_distribution: Optional[dict] = None
    historical_discount_distribution: Optional[dict] = None


class DiscountBinsResponse(BaseModel):
    """Response listing available discount levels."""
    discount_bins: list[float]
    n_actions: int
