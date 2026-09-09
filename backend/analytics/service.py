"""
Model Service — Singleton for DQN Model Inference
====================================================
Loads the trained DQN agent and preprocessor once at startup,
then exposes prediction methods for the API endpoints.
"""

import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional

from backend.config import get_settings, PROJECT_ROOT

# Ensure the project root is on sys.path so we can import the model package
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from model.data_preprocessor import EcommerceDataPreprocessor


class ModelService:
    """
    Singleton service that wraps the trained DQN agent.
    
    Loaded once at FastAPI startup and kept in memory for fast inference.
    """

    _instance: Optional["ModelService"] = None

    def __init__(self):
        self.agent: Optional[DQNAgent] = None
        self.preprocessor: Optional[EcommerceDataPreprocessor] = None
        self.evaluation_results: Optional[dict] = None
        self.hype_results: Optional[dict] = None
        self._is_loaded = False

    @classmethod
    def get_instance(cls) -> "ModelService":
        """Get or create the singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load(self, model_path: Optional[str] = None):
        """
        Load the DQN agent and preprocessor from disk.
        
        Args:
            model_path: Path to the saved model directory.
                        Defaults to config.MODEL_PATH.
        """
        settings = get_settings()
        model_path = model_path or settings.MODEL_PATH
        model_dir = Path(model_path)

        if not model_dir.exists():
            raise FileNotFoundError(
                f"Model directory not found: {model_dir}. "
                f"Run `python run_model.py` first to train the model."
            )

        print(f"[ModelService] Loading model from {model_dir}...")

        # Load preprocessor (encoders, scaler, config)
        self.preprocessor = EcommerceDataPreprocessor()
        self.preprocessor.load_saved(str(model_dir))

        # Load agent config to get dimensions
        agent_config_path = model_dir / "agent_config.json"
        with open(agent_config_path, "r") as f:
            agent_config = json.load(f)

        state_dim = len(self.preprocessor.feature_columns)
        n_actions = len(self.preprocessor.discount_bins)

        # Load agent
        self.agent = DQNAgent(
            state_dim=state_dim,
            n_actions=n_actions,
        )
        self.agent.load(str(model_dir))

        # Load evaluation results if available
        eval_path = model_dir.parent / "evaluation_results.json"
        if eval_path.exists():
            with open(eval_path, "r") as f:
                self.evaluation_results = json.load(f)
                
        self._is_loaded = True
        print(f"[ModelService] Model loaded successfully. "
              f"State dim: {state_dim}, Actions: {n_actions}")

    def load_hype_results(self):
        """Load hype evaluation results independently of DQN model."""
        hype_path = PROJECT_ROOT / "model" / "saved_hype" / "hype_evaluation_results.json"
        if hype_path.exists():
            with open(hype_path, "r") as f:
                self.hype_results = json.load(f)
            print(f"[ModelService] Hype results loaded ({len(self.hype_results.get('product_predictions', {}))} products)")
        else:
            print(f"[ModelService] WARNING: Hype results not found at {hype_path}")

    def predict_discount(self, features: dict) -> dict:
        """
        Predict the optimal discount for a single sale.
        
        Args:
            features: Dict with keys matching the PredictRequest schema.
        
        Returns:
            Dict with recommended_discount, confidence, q_values, etc.
        """
        self._ensure_loaded()

        # Build a single-row DataFrame that mimics the raw sales data
        row_data = self._features_to_dataframe(features)

        # Run through the preprocessor pipeline (without fitting)
        df = self.preprocessor.clean(row_data)
        df = self.preprocessor.engineer_features(df)
        df = self.preprocessor.encode_and_scale(df, fit=False)

        # Extract state vector
        state = self.preprocessor.get_state_vector(df)[0]

        # Get Q-values from the agent
        q_values = self.agent.get_q_values(state)
        best_action = int(np.argmax(q_values))
        best_discount = self.preprocessor.discount_bins[best_action]

        # Build Q-value map
        q_value_map = {
            str(self.preprocessor.discount_bins[i]): float(q_values[i])
            for i in range(len(self.preprocessor.discount_bins))
        }

        return {
            "recommended_discount": best_discount,
            "recommended_discount_bin": best_action,
            "confidence": float(q_values[best_action]),
            "q_values": q_value_map,
            "all_discount_options": self.preprocessor.discount_bins,
        }

    def batch_predict(self, records: list[dict]) -> list[dict]:
        """
        Predict optimal discounts for multiple sales records.
        
        Args:
            records: List of feature dicts.
        
        Returns:
            List of prediction result dicts.
        """
        return [self.predict_discount(r) for r in records]

    def evaluate_dataset(self, file_path: str) -> dict:
        """
        Evaluates a complete dataset from an Excel or CSV file using the pre-trained RL agent.
        Returns the analysis results in a structured format suitable for DocumentAnalysis.
        """
        self._ensure_loaded()
        
        # Load dataset
        df_raw = self.preprocessor.load_data(file_path)
        
        # Clean and engineer features
        df = self.preprocessor.clean(df_raw)
        df = self.preprocessor.engineer_features(df)
        
        # Encode and scale (fit=False)
        df = self.preprocessor.encode_and_scale(df, fit=False)
        
        # Prepare data dict
        states = self.preprocessor.get_state_vector(df)
        actions = self.preprocessor.get_actions(df)
        rewards = self.preprocessor.get_rewards(df)
        
        data_dict = {
            'states': states,
            'actions': actions,
            'rewards': rewards,
            'dataframe': df,
        }
        
        # Evaluate
        from model.evaluate import ModelEvaluator
        evaluator = ModelEvaluator(self.agent, self.preprocessor)
        metrics = evaluator.evaluate_full(data_dict, df=df)
        
        profit_imp_pct = metrics.get('profit_improvement_pct', 0.0)
        action_agreement = metrics.get('action_agreement_rate', 0.0)
        
        # Format as expected by frontend
        insights = {
            "summary": f"Analyzed {len(df)} sales records using the custom RL Model. The AI model estimates a {profit_imp_pct:.1f}% profit improvement over historical discount strategies.",
            "entities": ["Custom DQN Agent", "Historical Sales Benchmarks", "AI Optimized Pricing"],
            "key_metrics": {
                "Historical Profit": f"₹{metrics.get('total_historical_profit', 0):,.2f}",
                "AI Estimated Profit": f"₹{metrics.get('total_agent_estimated_profit', 0):,.2f}",
                "Profit Improvement": f"+{profit_imp_pct:.1f}%" if profit_imp_pct > 0 else f"{profit_imp_pct:.1f}%",
                "Action Agreement": f"{action_agreement:.1f}%",
            },
            "sentiment": "Positive" if profit_imp_pct > 0 else "Neutral"
        }
        
        return insights

    def get_evaluation_summary(self) -> dict:
        """Return the cached evaluation results from training."""
        self._ensure_loaded()

        if self.evaluation_results is None:
            return {"error": "No evaluation results found. Re-run evaluation."}

        return self.evaluation_results

    def get_discount_bins(self) -> dict:
        """Return the available discount bins and action count."""
        self._ensure_loaded()
        return {
            "discount_bins": self.preprocessor.discount_bins,
            "n_actions": len(self.preprocessor.discount_bins),
        }

    def _features_to_dataframe(self, features: dict) -> pd.DataFrame:
        """
        Convert API feature dict to a single-row DataFrame
        matching the schema expected by EcommerceDataPreprocessor.
        """
        from datetime import datetime

        # Build a row that looks like the raw data the preprocessor expects
        row = {
            "State": features.get("state", "Unknown"),
            "Category": features.get("category", "Unknown"),
            "PaymentMethod": features.get("payment_method", "Unknown"),
            "CustomerSegment": features.get("segment", "Unknown"),
            "Gender": features.get("gender", "Unknown"),
            
            "UnitPrice": features.get("unit_price", 100.0),
            "Quantity": features.get("quantity", 1),
            "TotalAmount": features.get("total_amount", 100.0),
            "Profit": features.get("total_amount", 100.0) * 0.15,
            "Age": features.get("age", 30),
            "CustomerLTV": features.get("customer_ltv", 1000.0),
            "DaysSinceLastPurchase": features.get("days_since_last_purchase", 10),
            "PurchaseFrequency": features.get("purchase_frequency", 5),
            "AvgOrderValue": features.get("avg_order_value", 150.0),
            "CustomerReturnRate": features.get("return_rate", 0.05),
            
            "OrderDate": datetime.now(),
        }

        return pd.DataFrame([row])

    def _ensure_loaded(self):
        """Raise an error if the model hasn't been loaded yet."""
        if not self._is_loaded:
            raise RuntimeError(
                "Model not loaded. Call ModelService.load() at startup."
            )

    def get_hype_prediction(self, stock_code: str) -> dict:
        """
        Returns the hype prediction for a specific product.
        """
        if not self.hype_results:
            raise ValueError("Hype model results not loaded. Run evaluate_hype.py first.")
            
        preds = self.hype_results.get('product_predictions', {})
        if stock_code not in preds:
            raise ValueError(f"No hype prediction found for {stock_code}")
            
        data = preds[stock_code]
        
        # Convert prediction bin to score 0-100
        # Bins: 0: Severe Drop, 1: Drop, 2: Steady, 3: Growth, 4: Viral
        bin_score = {0: 10, 1: 30, 2: 50, 3: 75, 4: 95}
        score = bin_score.get(data['predicted_bin'], 50)
        
        return {
            "stock_code": stock_code,
            "hype_score": score,
            "predicted_bin": data['predicted_bin'],
            "actual_growth_percentage": round(data['actual_growth'] * 100, 2),
            "historical_sales": data['historical_sales'],
            "target_month": str(data['target_month'])
        }
