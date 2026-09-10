"""
Sales Forecaster — Prophet-Based Time-Series Revenue Prediction
================================================================
Aggregates historical e-commerce sales by month and category,
trains Facebook Prophet models, and produces future revenue
forecasts with confidence intervals.

Features:
  - Per-category and overall revenue forecasting
  - Configurable forecast horizon (3, 6, 12 months)
  - Confidence intervals (80% and 95%)
  - Seasonal decomposition (monthly, yearly)
  - Indian holiday effects (Diwali, Holi, etc.)
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional
import json
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

# Prophet is optional — gracefully degrade if not installed
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False


class SalesForecaster:
    """
    Time-series revenue forecaster for e-commerce sales data.

    Uses Facebook Prophet to produce monthly revenue forecasts
    per product category, with confidence intervals.

    Attributes:
        models: dict mapping category name → fitted Prophet model
        historical: dict mapping category name → historical monthly data
    """

    # Indian holidays / shopping events that affect e-commerce sales
    INDIAN_HOLIDAYS = pd.DataFrame({
        "holiday": [
            "Republic Day Sale", "Holi Sale", "Independence Day Sale",
            "Raksha Bandhan", "Ganesh Chaturthi", "Navratri",
            "Dussehra Sale", "Diwali Sale", "Christmas Sale",
            "New Year Sale",
        ],
        "ds": pd.to_datetime([
            "2024-01-26", "2024-03-25", "2024-08-15",
            "2024-08-19", "2024-09-07", "2024-10-03",
            "2024-10-12", "2024-11-01", "2024-12-25",
            "2025-01-01",
        ]),
        "lower_window": [0] * 10,
        "upper_window": [3, 2, 3, 1, 1, 5, 2, 7, 5, 2],
    })

    def __init__(self):
        self.models: dict[str, Prophet] = {}
        self.historical: dict[str, pd.DataFrame] = {}
        self._is_fitted = False

    def prepare_data(self, data_dir: str) -> dict[str, pd.DataFrame]:
        """
        Load and aggregate sales data into monthly time-series per category.

        Args:
            data_dir: Path to directory containing CSVs.

        Returns:
            Dict mapping category → DataFrame with columns ['ds', 'y']
            where ds = month start date, y = total revenue that month.
        """
        data_path = Path(data_dir)

        # Check for uploaded master dataset file first
        master_file = data_path / "uploaded_sales_dataset.csv"
        if master_file.exists():
            df = pd.read_csv(master_file)
        else:
            # Fallback to legacy multi-CSV tables
            orders = pd.read_csv(data_path / "orders.csv")
            order_items = pd.read_csv(data_path / "order_items.csv")
            products = pd.read_csv(data_path / "products.csv")

            df = order_items.merge(
                orders[["OrderID", "OrderDate"]],
                on="OrderID", how="inner"
            )

            if "Category" not in df.columns and "StockCode" in df.columns:
                df = df.merge(
                    products[["StockCode", "Category"]],
                    on="StockCode", how="left"
                )

        df["OrderDate"] = pd.to_datetime(df["OrderDate"], errors="coerce")
        df = df.dropna(subset=["OrderDate"])

        # Fill missing category
        if "Category" in df.columns:
            df["Category"] = df["Category"].fillna("-").replace(["nan", "None", "null", ""], "-")
        else:
            df["Category"] = "-"

        # Compute line total if not present
        if "TotalAmount" not in df.columns:
            df["TotalAmount"] = df["UnitPrice"] * df["Quantity"]

        # Aggregate by month and category
        df["Month"] = df["OrderDate"].dt.to_period("M").dt.to_timestamp()

        category_series = {}

        # Overall aggregation
        overall = (
            df.groupby("Month")["TotalAmount"]
            .sum()
            .reset_index()
            .rename(columns={"Month": "ds", "TotalAmount": "y"})
            .sort_values("ds")
        )
        category_series["All Categories"] = overall

        # Per-category aggregation
        for cat in df["Category"].unique():
            cat_df = df[df["Category"] == cat]
            monthly = (
                cat_df.groupby("Month")["TotalAmount"]
                .sum()
                .reset_index()
                .rename(columns={"Month": "ds", "TotalAmount": "y"})
                .sort_values("ds")
            )
            if len(monthly) >= 4:  # Need at least 4 months for a meaningful forecast
                category_series[cat] = monthly

        self.historical = category_series
        print(f"[Forecaster] Prepared {len(category_series)} time-series "
              f"({len(overall)} months of data)")
        return category_series

    def train(self, data_dir: str):
        """
        Train Prophet models for all categories.

        Args:
            data_dir: Path to data directory.
        """
        if not PROPHET_AVAILABLE:
            print("[Forecaster] WARNING: Prophet not installed. "
                  "Using fallback linear forecast.")
            self.prepare_data(data_dir)
            self._is_fitted = True
            return

        category_series = self.prepare_data(data_dir)

        for category, ts_df in category_series.items():
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
                seasonality_mode="multiplicative",
                holidays=self.INDIAN_HOLIDAYS,
                interval_width=0.95,
            )

            # Add monthly seasonality
            model.add_seasonality(
                name="monthly", period=30.5, fourier_order=5
            )

            model.fit(ts_df)
            self.models[category] = model
            print(f"  Trained model for '{category}' "
                  f"({len(ts_df)} data points)")

        self._is_fitted = True
        print(f"[Forecaster] All {len(self.models)} models trained.")

    def forecast(
        self,
        horizon_months: int = 6,
        category: Optional[str] = None,
    ) -> dict:
        """
        Generate future sales forecasts.

        Args:
            horizon_months: Number of months to forecast (default 6).
            category: Specific category to forecast, or None for all.

        Returns:
            Dict with forecast data structured for the API response.
        """
        if not self._is_fitted:
            raise RuntimeError("Forecaster not trained. Call train() first.")

        categories = (
            [category] if category and category in self.historical
            else list(self.historical.keys())
        )

        results = {}

        for cat in categories:
            if PROPHET_AVAILABLE and cat in self.models:
                results[cat] = self._prophet_forecast(cat, horizon_months)
            else:
                results[cat] = self._fallback_forecast(cat, horizon_months)

        # Compute overall summary
        summary = self._compute_summary(results, horizon_months)

        return {
            "forecasts": results,
            "summary": summary,
            "horizon_months": horizon_months,
        }

    def _prophet_forecast(self, category: str, horizon: int) -> dict:
        """Generate forecast using the trained Prophet model."""
        model = self.models[category]
        historical = self.historical[category]

        # Create future dataframe
        future = model.make_future_dataframe(periods=horizon, freq="MS")
        prediction = model.predict(future)

        # Split into historical fit and future forecast
        n_hist = len(historical)

        # Historical data
        hist_dates = historical["ds"].dt.strftime("%Y-%m").tolist()
        hist_values = historical["y"].round(2).tolist()

        # Future forecast
        future_pred = prediction.iloc[n_hist:]
        forecast_dates = future_pred["ds"].dt.strftime("%Y-%m").tolist()
        forecast_values = future_pred["yhat"].round(2).tolist()
        forecast_lower = future_pred["yhat_lower"].round(2).tolist()
        forecast_upper = future_pred["yhat_upper"].round(2).tolist()

        # Trend and seasonality components
        trend = prediction["trend"].round(2).tolist()

        return {
            "category": category,
            "historical": {
                "dates": hist_dates,
                "values": hist_values,
            },
            "forecast": {
                "dates": forecast_dates,
                "values": forecast_values,
                "lower_bound": forecast_lower,
                "upper_bound": forecast_upper,
            },
            "trend": trend[-horizon:],
        }

    def _fallback_forecast(self, category: str, horizon: int) -> dict:
        """
        Simple linear trend + seasonal fallback when Prophet is unavailable.
        """
        historical = self.historical[category]
        hist_dates = historical["ds"].dt.strftime("%Y-%m").tolist()
        hist_values = historical["y"].values

        # Fit a simple linear trend
        x = np.arange(len(hist_values))
        if len(x) >= 2:
            coeffs = np.polyfit(x, hist_values, 1)
            slope, intercept = coeffs
        else:
            slope, intercept = 0, hist_values.mean() if len(hist_values) > 0 else 0

        # Compute seasonal factors (average deviation per month)
        monthly_avg = {}
        for i, row in historical.iterrows():
            month = row["ds"].month
            if month not in monthly_avg:
                monthly_avg[month] = []
            monthly_avg[month].append(row["y"])
        seasonal = {m: np.mean(v) for m, v in monthly_avg.items()}
        overall_avg = np.mean(list(seasonal.values())) if seasonal else 1.0

        # Generate forecast
        last_date = historical["ds"].max()
        forecast_dates = []
        forecast_values = []
        forecast_lower = []
        forecast_upper = []

        for i in range(1, horizon + 1):
            future_date = last_date + pd.DateOffset(months=i)
            future_x = len(hist_values) + i - 1
            trend_val = slope * future_x + intercept

            # Apply seasonal factor
            month = future_date.month
            if month in seasonal and overall_avg > 0:
                seasonal_factor = seasonal[month] / overall_avg
            else:
                seasonal_factor = 1.0

            predicted = max(0, trend_val * seasonal_factor)

            # Simple confidence interval (±15%)
            forecast_dates.append(future_date.strftime("%Y-%m"))
            forecast_values.append(round(predicted, 2))
            forecast_lower.append(round(predicted * 0.85, 2))
            forecast_upper.append(round(predicted * 1.15, 2))

        return {
            "category": category,
            "historical": {
                "dates": hist_dates,
                "values": hist_values.round(2).tolist(),
            },
            "forecast": {
                "dates": forecast_dates,
                "values": forecast_values,
                "lower_bound": forecast_lower,
                "upper_bound": forecast_upper,
            },
            "trend": forecast_values,
        }

    def _compute_summary(self, results: dict, horizon: int) -> dict:
        """Compute summary statistics across all forecasts."""
        total_forecast = 0
        total_historical_last_month = 0
        peak_month = None
        peak_value = 0
        category_highlights = []

        for cat, data in results.items():
            forecast_vals = data["forecast"]["values"]
            if forecast_vals:
                cat_total = sum(forecast_vals)
                total_forecast += cat_total

                # Find peak month for this category
                max_val = max(forecast_vals)
                max_idx = forecast_vals.index(max_val)
                max_date = data["forecast"]["dates"][max_idx]

                if max_val > peak_value:
                    peak_value = max_val
                    peak_month = max_date

                category_highlights.append({
                    "category": cat,
                    "predicted_total": round(cat_total, 2),
                    "avg_monthly": round(cat_total / len(forecast_vals), 2),
                    "peak_month": max_date,
                    "peak_value": round(max_val, 2),
                })

            # Last historical month value
            hist_vals = data["historical"]["values"]
            if hist_vals:
                total_historical_last_month += hist_vals[-1]

        # YoY growth estimate (comparing last historical month with avg forecast)
        avg_forecast_monthly = (
            total_forecast / horizon if horizon > 0 else 0
        )
        yoy_growth = (
            ((avg_forecast_monthly - total_historical_last_month)
             / total_historical_last_month * 100)
            if total_historical_last_month > 0 else 0
        )

        return {
            "total_forecasted_revenue": round(total_forecast, 2),
            "avg_monthly_forecast": round(avg_forecast_monthly, 2),
            "last_month_actual": round(total_historical_last_month, 2),
            "estimated_growth_pct": round(yoy_growth, 2),
            "peak_month": peak_month,
            "peak_month_value": round(peak_value, 2),
            "categories_analyzed": len(results),
            "category_highlights": sorted(
                category_highlights,
                key=lambda x: x["predicted_total"],
                reverse=True,
            ),
        }

    def save(self, directory: str):
        """Save forecaster state (historical data + model configs)."""
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)

        # Save historical data
        hist_data = {}
        for cat, df in self.historical.items():
            hist_data[cat] = {
                "dates": df["ds"].dt.strftime("%Y-%m-%d").tolist(),
                "values": df["y"].tolist(),
            }

        with open(directory / "forecaster_historical.json", "w") as f:
            json.dump(hist_data, f, indent=2)

        # If Prophet models exist, we save a serialized version
        if PROPHET_AVAILABLE and self.models:
            from prophet.serialize import model_to_json
            for cat, model in self.models.items():
                safe_name = cat.replace(" ", "_").replace("/", "_")
                with open(directory / f"prophet_{safe_name}.json", "w") as f:
                    f.write(model_to_json(model))

        print(f"[Forecaster] Saved to {directory}")

    def load(self, directory: str):
        """Load a previously saved forecaster."""
        directory = Path(directory)

        # Load historical data
        hist_path = directory / "forecaster_historical.json"
        if hist_path.exists():
            with open(hist_path, "r") as f:
                hist_data = json.load(f)

            for cat, data in hist_data.items():
                self.historical[cat] = pd.DataFrame({
                    "ds": pd.to_datetime(data["dates"]),
                    "y": data["values"],
                })

        # Load Prophet models if available
        from prophet.serialize import model_from_json
        if PROPHET_AVAILABLE:
            for file in directory.glob("prophet_*.json"):
                cat_name = file.stem.replace("prophet_", "").replace("_", " ")
                with open(file, "r") as f:
                    self.models[cat_name] = model_from_json(f.read())

        self._is_fitted = True
        print(f"[Forecaster] Loaded from {directory} "
        f"({len(self.historical)} categories)")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Train the Sales Forecaster"
    )
    parser.add_argument(
        "--data_dir", type=str, default="data",
        help="Directory containing the e-commerce CSVs"
    )
    parser.add_argument(
        "--save_dir", type=str, default="model/saved_forecast",
        help="Directory to save the trained forecaster"
    )
    parser.add_argument(
        "--horizon", type=int, default=6,
        help="Forecast horizon in months"
    )

    args = parser.parse_args()

    forecaster = SalesForecaster()
    forecaster.train(args.data_dir)
    forecaster.save(args.save_dir)

    # Quick test forecast
    result = forecaster.forecast(horizon_months=args.horizon)
    print(f"\nForecast summary: {json.dumps(result['summary'], indent=2)}")
