from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
from backend.database import Base
from datetime import datetime

class Promotion(Base):
    __tablename__ = "promotions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    description = Column(String(200))
    discount_percentage = Column(Float, default=0.0)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    ai_recommended = Column(Boolean, default=False)

class MLPrediction(Base):
    __tablename__ = "ml_predictions"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100))
    target_entity_id = Column(String(100))  # Can be product_id or customer_id
    prediction_type = Column(String(50))    # e.g., 'Discount', 'Hype', 'Forecast'
    prediction_value = Column(Float)
    confidence_score = Column(Float, nullable=True)
    features_used = Column(JSON, nullable=True) # Storing state features if needed
    created_at = Column(DateTime, default=datetime.utcnow)
