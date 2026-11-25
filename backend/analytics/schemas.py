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
    
    These match the features expected by the Dueling DDQN model.
    """
    customer_id: Optional[int] = Field(None, description="Optional customer ID to pull real RFM & CLV metrics")
    stock_code: Optional[str] = Field(None, description="Optional product stock code to pull real price and category")
    state: str = Field("Unknown", examples=["Delhi"])
    category: str = Field("Unknown", examples=["Electronics"])
    payment_method: str = Field("Unknown", examples=["Credit Card"])
    segment: str = Field("Unknown", examples=["Loyal"])
    gender: str = Field("Unknown", examples=["Female"])
    
    unit_price: float = Field(..., gt=0, examples=[500.0])
    quantity: int = Field(..., ge=1, examples=[2])
    total_amount: float = Field(..., gt=0, examples=[1000.0])
    
    age: Optional[int] = Field(30, examples=[28])
    customer_ltv: Optional[float] = Field(0.0, examples=[5000.0])
    days_since_last_purchase: Optional[int] = Field(0, examples=[10])
    purchase_frequency: Optional[int] = Field(1, examples=[5])
    avg_order_value: Optional[float] = Field(0.0, examples=[1000.0])
    return_rate: Optional[float] = Field(0.0, examples=[0.05])


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
    profit_improvement_pct: float = 0.0
    total_historical_profit: float = 0.0
    total_agent_estimated_profit: float = 0.0
    mean_historical_reward: float = 0.0
    mean_agent_estimated_reward: float = 0.0
    historical_positive_profit_rate: float = 0.0
    agent_positive_profit_rate: float = 0.0
    action_agreement_rate: float = 0.0
    per_category: Optional[dict] = None
    agent_discount_distribution: Optional[dict] = None
    historical_discount_distribution: Optional[dict] = None
    overall: Optional[dict] = None
    by_segment: Optional[dict] = None
    by_state_top5: Optional[dict] = None
    by_payment: Optional[dict] = None


class DiscountBinsResponse(BaseModel):
    """Response listing available discount levels."""
    discount_bins: list[float]
    n_actions: int


# ── Forecast Schemas ─────────────────────────────────────────

class ForecastDataPoint(BaseModel):
    """Time-series data for a single forecast category."""
    category: str
    historical: dict = {}  # {dates: [...], values: [...]}
    forecast: dict = {}    # {dates: [...], values: [...], lower_bound: [...], upper_bound: [...]}
    trend: list[float] = []
    model_type: Optional[str] = None


class ForecastSummary(BaseModel):
    """Summary statistics for the forecast."""
    total_forecasted_revenue: float = 0.0
    avg_monthly_forecast: float = 0.0
    last_month_actual: float = 0.0
    estimated_growth_pct: float = 0.0
    peak_month: Optional[str] = None
    peak_month_value: float = 0.0
    categories_analyzed: int = 0
    category_highlights: list[dict] = []
    is_fallback: Optional[bool] = False
    notice: Optional[str] = None


class ForecastResponse(BaseModel):
    """Response for sales forecast endpoint."""
    forecasts: dict[str, ForecastDataPoint] = {}
    summary: ForecastSummary
    horizon_months: int = 6
    has_data: Optional[bool] = True
    is_fallback: Optional[bool] = False
    model_used: Optional[str] = None
    notice: Optional[str] = None


class DemandProductSignal(BaseModel):
    """Demand signal for a single product."""
    stock_code: str
    description: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = 0
    total_sold: Optional[int] = 0
    stock_status: Optional[str] = None
    demand_score: int
    demand_label: str
    demand_emoji: str
    demand_color: str
    predicted_bin: int
    actual_growth_pct: float
    historical_sales: list = []
    target_month: str = ""


class DemandRecommendation(BaseModel):
    """Actionable recommendation from demand analysis."""
    type: str  # "opportunity", "warning", "info"
    priority: str  # "high", "medium", "low"
    title: str
    description: str


class DemandAnalysisResponse(BaseModel):
    """Response for the demand analysis endpoint."""
    product_demand_signals: list[DemandProductSignal] = []
    category_forecast_summary: list[dict] = []
    seasonal_patterns: dict = {}
    top_rising_products: list[dict] = []
    top_declining_products: list[dict] = []
    demand_distribution: dict = {}
    recommendations: list[DemandRecommendation] = []
    has_data: Optional[bool] = True
    notice: Optional[str] = None


class CategoryTrendItem(BaseModel):
    """Trend data for a single category."""
    category: str
    historical_dates: list[str]
    historical_values: list[float]
    forecast_dates: list[str]
    forecast_values: list[float]
    forecast_lower: list[float]
    forecast_upper: list[float]
    growth_trend_pct: float


class CategoryTrendResponse(BaseModel):
    """Response for category trends endpoint."""
    categories: list[CategoryTrendItem]
    total_categories: int

