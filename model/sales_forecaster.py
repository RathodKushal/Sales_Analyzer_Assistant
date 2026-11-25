"""
Sales Forecaster — Prophet-Based Time-Series Revenue Prediction with Adaptive Fallback
========================================================================================
Aggregates sales data from live database billing/orders (and optional historical uploads)
by month and category. Fits Facebook Prophet models when sufficient history is available (>=4 months),
and provides an intelligent, graceful moving-average baseline fallback for recent store data,
ensuring predictions are always available and never erroneously return 0.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Union, Any
import json
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

# Prophet is optional / resilient
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False


class SalesForecaster:
    """
    Time-series revenue forecaster for e-commerce sales and billing data.

    Reads live billing/orders data grouped by category and date.
    Uses Facebook Prophet when history is >=4 months, and a moving-average
    trend fallback when history is limited.
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
        self.models: dict[str, Any] = {}
        self.historical: dict[str, pd.DataFrame] = {}
        self._is_fitted = False
        self.is_fallback = False
        self.model_used = "Prophet (Time-Series AI)"
        self.notice = None
        self.raw_records_count = 0

    def load_from_db(self, db=None) -> pd.DataFrame:
        """
        Load live billing/orders data directly from database tables.
        Joins orders with order_items and products to extract:
        OrderID, OrderDate, Category, TotalAmount, Quantity.
        """
        close_session = False
        if db is None:
            try:
                from backend.database import SessionLocal
                db = SessionLocal()
                close_session = True
            except Exception as e:
                print(f"[Forecaster] Could not create DB session: {e}")
                return pd.DataFrame()

        try:
            from backend.orders import models as ord_models
            from backend.products import models as prod_models

            orders = db.query(ord_models.Order).all()
            if not orders:
                return pd.DataFrame()

            items = db.query(ord_models.OrderItem).all()
            prods = {p.id: p for p in db.query(prod_models.Product).all()}
            prods_sku = {p.stock_code: p for p in db.query(prod_models.Product).all()}

            rows = []
            if items:
                orders_map = {str(o.order_id): o for o in orders if o.order_id}
                orders_id_map = {o.id: o for o in orders}

                for item in items:
                    ord_obj = orders_map.get(str(item.order_id)) or orders_id_map.get(item.order_id)
                    if not ord_obj or not ord_obj.order_date:
                        continue

                    prod = prods.get(item.product_id) or prods_sku.get(item.stock_code)
                    category = prod.category if prod and prod.category else "Miscellaneous"

                    if item.line_total and float(item.line_total) > 0:
                        revenue = float(item.line_total)
                    elif item.unit_price and item.quantity:
                        revenue = float(item.unit_price) * float(item.quantity) - float(item.discount or 0.0)
                    else:
                        revenue = float(ord_obj.total_amount or 0.0)

                    rows.append({
                        "OrderID": ord_obj.order_id or str(ord_obj.id),
                        "OrderDate": ord_obj.order_date,
                        "Category": category,
                        "TotalAmount": max(0.0, revenue),
                        "Quantity": item.quantity or 1
                    })

            # If order_items table has no matched rows, use orders table directly
            if not rows:
                for ord_obj in orders:
                    if not ord_obj.order_date:
                        continue
                    rows.append({
                        "OrderID": ord_obj.order_id or str(ord_obj.id),
                        "OrderDate": ord_obj.order_date,
                        "Category": "General",
                        "TotalAmount": float(ord_obj.total_amount or 0.0),
                        "Quantity": ord_obj.total_items or 1
                    })

            return pd.DataFrame(rows)
        except Exception as e:
            print(f"[Forecaster] Error querying live billing/orders: {e}")
            return pd.DataFrame()
        finally:
            if close_session:
                db.close()

    def prepare_data(self, data_source=None, db=None) -> dict[str, pd.DataFrame]:
        """
        Load and aggregate sales data into monthly time-series per category.
        Reads live from the database session, DataFrame, or data directory.
        """
        df = pd.DataFrame()

        # 1. Primary: load from DB if provided, or if data_source is None
        if db is not None:
            df = self.load_from_db(db)
        elif isinstance(data_source, pd.DataFrame):
            df = data_source
        elif data_source is None:
            df = self.load_from_db()

        # 2. If DB was empty or data_source is a path string, check disk files
        if df.empty and data_source and isinstance(data_source, (str, Path)):
            data_path = Path(data_source)
            master_file = data_path / "uploaded_sales_dataset.csv"
            if master_file.exists():
                try:
                    df = pd.read_csv(master_file)
                except Exception as e:
                    print(f"[Forecaster] Error reading {master_file}: {e}")
            elif (data_path / "orders.csv").exists():
                try:
                    orders = pd.read_csv(data_path / "orders.csv")
                    items_path = data_path / "order_items.csv"
                    prods_path = data_path / "products.csv"
                    if items_path.exists():
                        order_items = pd.read_csv(items_path)
                        df = order_items.merge(orders[["OrderID", "OrderDate"]], on="OrderID", how="inner")
                        if prods_path.exists() and "Category" not in df.columns and "StockCode" in df.columns:
                            products = pd.read_csv(prods_path)
                            df = df.merge(products[["StockCode", "Category"]], on="StockCode", how="left")
                    else:
                        df = orders
                except Exception as e:
                    print(f"[Forecaster] Error reading CSVs: {e}")

        # If still empty, return empty dict
        if df.empty or "OrderDate" not in df.columns:
            self.historical = {}
            self.raw_records_count = 0
            return {}

        self.raw_records_count = len(df)
        df["OrderDate"] = pd.to_datetime(df["OrderDate"], errors="coerce")
        df = df.dropna(subset=["OrderDate"])
        if df.empty:
            self.historical = {}
            return {}

        # Fill missing category
        if "Category" in df.columns:
            df["Category"] = df["Category"].fillna("Miscellaneous").replace(["nan", "None", "null", "", "-"], "Miscellaneous")
        else:
            df["Category"] = "Miscellaneous"

        # Compute line total if not present
        if "TotalAmount" not in df.columns:
            if "UnitPrice" in df.columns and "Quantity" in df.columns:
                df["TotalAmount"] = df["UnitPrice"] * df["Quantity"]
            elif "Revenue" in df.columns:
                df["TotalAmount"] = df["Revenue"]
            else:
                df["TotalAmount"] = 0.0

        df["TotalAmount"] = pd.to_numeric(df["TotalAmount"], errors="coerce").fillna(0.0)

        # Aggregate by month and category
        df["Month"] = df["OrderDate"].dt.to_period("M").dt.to_timestamp()

        category_series = {}

        # Overall aggregation (All Categories)
        overall = (
            df.groupby("Month")["TotalAmount"]
            .sum()
            .reset_index()
            .rename(columns={"Month": "ds", "TotalAmount": "y"})
            .sort_values("ds")
        )
        if len(overall) > 0:
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
            # Retain all categories with sales so fallback can forecast for them
            if len(monthly) > 0 and monthly["y"].sum() > 0:
                category_series[cat] = monthly

        self.historical = category_series
        print(f"[Forecaster] Prepared {len(category_series)} category time-series "
              f"({len(overall)} months of history, {len(df)} total transactions)")
        return category_series

    def train(self, data_source=None, db=None):
        """
        Train Prophet models where sufficient data is available (>=4 months).
        Gracefully handles small datasets by priming for moving-average baseline fallback.
        """
        category_series = self.prepare_data(data_source=data_source, db=db)
        if not category_series:
            self._is_fitted = False
            self.models = {}
            return

        self.models = {}
        prophet_success = 0

        for category, ts_df in category_series.items():
            # Prophet requires at least 4 monthly points for reliable seasonal forecasting
            if PROPHET_AVAILABLE and len(ts_df) >= 4:
                try:
                    has_yearly = len(ts_df) >= 12
                    model = Prophet(
                        yearly_seasonality=has_yearly,
                        weekly_seasonality=False,
                        daily_seasonality=False,
                        changepoint_prior_scale=0.05,
                        interval_width=0.95,
                    )
                    if len(ts_df) >= 6:
                        model.add_seasonality(name="monthly", period=30.5, fourier_order=3)

                    model.fit(ts_df)
                    self.models[category] = model
                    prophet_success += 1
                except Exception as e:
                    print(f"[Forecaster] Prophet training skipped for '{category}' ({e}). Using moving average fallback.")
            else:
                # Less than 4 months — intentionally defer to moving-average fallback
                pass

        self._is_fitted = True
        if prophet_success > 0:
            self.is_fallback = False
            self.model_used = "Prophet (Time-Series AI)"
        else:
            self.is_fallback = True
            self.model_used = "Moving Average Baseline"

    def forecast(
        self,
        horizon_months: int = 6,
        category: Optional[str] = None,
        db=None,
    ) -> dict:
        """
        Generate future sales forecasts.
        Reads live sales data from billing/orders. Returns structured forecast
        with KPI summaries, confidence intervals, and category breakdown.
        """
        # Ensure latest data is loaded and trained
        if not self._is_fitted or not self.historical:
            self.train(db=db)

        if not self.historical:
            return {
                "forecasts": {},
                "summary": {
                    "total_forecasted_revenue": 0.0,
                    "avg_monthly_forecast": 0.0,
                    "last_month_actual": 0.0,
                    "estimated_growth_pct": 0.0,
                    "peak_month": "—",
                    "peak_month_value": 0.0,
                    "categories_analyzed": 0,
                    "category_highlights": []
                },
                "has_data": False,
                "horizon_months": horizon_months,
                "is_fallback": True,
                "model_used": "No Data",
                "notice": "No billing transactions or sales history recorded yet. Complete sales in Billing to generate revenue predictions."
            }

        categories = (
            [category] if category and category in self.historical
            else list(self.historical.keys())
        )

        results = {}
        fallback_used = False

        for cat in categories:
            ts_df = self.historical.get(cat)
            if ts_df is None or len(ts_df) == 0:
                continue

            if PROPHET_AVAILABLE and cat in self.models:
                try:
                    results[cat] = self._prophet_forecast(cat, horizon_months)
                except Exception as e:
                    print(f"[Forecaster] Prophet predict error for '{cat}': {e}. Using fallback.")
                    results[cat] = self._fallback_forecast(cat, horizon_months)
                    fallback_used = True
            else:
                results[cat] = self._fallback_forecast(cat, horizon_months)
                fallback_used = True

        summary = self._compute_summary(results, horizon_months)
        months_hist = len(self.historical.get("All Categories", []))

        if fallback_used or months_hist < 4:
            notice = (
                f"Notice: Live sales dataset has {months_hist} historical month(s) from {self.raw_records_count} orders. "
                f"Using moving-average baseline forecast. Prophet multi-seasonal models will automatically engage as 4+ months of sales history accumulate."
            )
            model_name = "Moving Average Baseline"
            is_fb = True
        else:
            notice = f"Prophet time-series AI models active across {len(self.models)} product categories."
            model_name = "Prophet (Time-Series AI)"
            is_fb = False

        return {
            "forecasts": results,
            "summary": summary,
            "horizon_months": horizon_months,
            "has_data": True,
            "is_fallback": is_fb,
            "model_used": model_name,
            "notice": notice
        }

    def _prophet_forecast(self, category: str, horizon: int) -> dict:
        """Generate forecast using the trained Facebook Prophet model."""
        model = self.models[category]
        historical = self.historical[category]

        future = model.make_future_dataframe(periods=horizon, freq="MS")
        prediction = model.predict(future)

        n_hist = len(historical)

        hist_dates = historical["ds"].dt.strftime("%Y-%m").tolist()
        hist_values = [round(float(v), 2) for v in historical["y"].values]

        future_pred = prediction.iloc[n_hist:]
        forecast_dates = future_pred["ds"].dt.strftime("%Y-%m").tolist()
        forecast_values = [max(0.0, round(float(v), 2)) for v in future_pred["yhat"].values]
        forecast_lower = [max(0.0, round(float(v), 2)) for v in future_pred["yhat_lower"].values]
        forecast_upper = [max(0.0, round(float(v), 2)) for v in future_pred["yhat_upper"].values]

        trend = [round(float(v), 2) for v in prediction["trend"].iloc[-horizon:].values]

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
            "trend": trend,
            "model_type": "prophet",
        }

    def _fallback_forecast(self, category: str, horizon: int) -> dict:
        """
        Graceful moving average + trend fallback when Prophet is not available or history < 4 months.
        Never returns zero when actual sales exist.
        """
        historical = self.historical[category]
        hist_dates = historical["ds"].dt.strftime("%Y-%m").tolist()
        hist_values = [float(v) for v in historical["y"].values]

        n = len(hist_values)
        if n == 0:
            avg_val = 0.0
            slope = 0.0
            intercept = 0.0
        elif n == 1:
            avg_val = hist_values[0]
            slope = 0.0
            intercept = avg_val
        else:
            avg_val = float(np.mean(hist_values))
            x = np.arange(n)
            try:
                coeffs = np.polyfit(x, hist_values, 1)
                slope, intercept = coeffs
            except Exception:
                slope, intercept = 0.0, avg_val

        # Seasonal factors if multi-month history exists
        seasonal_factors = {}
        if n >= 4:
            monthly_totals = {}
            for _, row in historical.iterrows():
                m = row["ds"].month
                monthly_totals.setdefault(m, []).append(row["y"])
            seasonal_factors = {m: np.mean(vals) for m, vals in monthly_totals.items()}
            grand_avg = np.mean(list(seasonal_factors.values())) if seasonal_factors else 1.0
        else:
            grand_avg = 1.0

        last_date = historical["ds"].max()
        forecast_dates = []
        forecast_values = []
        forecast_lower = []
        forecast_upper = []

        for i in range(1, horizon + 1):
            future_date = last_date + pd.DateOffset(months=i)
            future_x = n + i - 1

            # Estimate trend value
            if n >= 2 and abs(slope) < avg_val * 0.5:
                trend_val = max(avg_val * 0.5, slope * future_x + intercept)
            else:
                trend_val = avg_val

            # Apply seasonality if present
            m = future_date.month
            if m in seasonal_factors and grand_avg > 0:
                s_factor = seasonal_factors[m] / grand_avg
            else:
                s_factor = 1.0

            predicted = max(0.0, trend_val * s_factor)
            forecast_dates.append(future_date.strftime("%Y-%m"))
            forecast_values.append(round(float(predicted), 2))
            forecast_lower.append(round(float(predicted * 0.85), 2))
            forecast_upper.append(round(float(predicted * 1.15), 2))

        return {
            "category": category,
            "historical": {
                "dates": hist_dates,
                "values": [round(v, 2) for v in hist_values],
            },
            "forecast": {
                "dates": forecast_dates,
                "values": forecast_values,
                "lower_bound": forecast_lower,
                "upper_bound": forecast_upper,
            },
            "trend": forecast_values,
            "model_type": "moving_average_baseline",
        }

    def _compute_summary(self, results: dict, horizon: int) -> dict:
        """Compute aggregate summary statistics across forecasts."""
        total_forecast = 0.0
        last_month_actual = 0.0
        peak_month = None
        peak_value = 0.0
        category_highlights = []

        # If All Categories is present, prioritize it for system-wide KPIs
        if "All Categories" in results:
            overall_data = results["All Categories"]
            f_vals = overall_data["forecast"]["values"]
            if f_vals:
                total_forecast = round(float(sum(f_vals)), 2)
                peak_value = max(f_vals)
                p_idx = f_vals.index(peak_value)
                peak_month = overall_data["forecast"]["dates"][p_idx]

            h_vals = overall_data["historical"]["values"]
            if h_vals:
                last_month_actual = round(float(h_vals[-1]), 2)
        else:
            # Aggregate across all available categories
            for cat, data in results.items():
                f_vals = data["forecast"]["values"]
                if f_vals:
                    total_forecast += sum(f_vals)
                    max_v = max(f_vals)
                    if max_v > peak_value:
                        peak_value = max_v
                        peak_month = data["forecast"]["dates"][f_vals.index(max_v)]
                h_vals = data["historical"]["values"]
                if h_vals:
                    last_month_actual += h_vals[-1]

        # Category highlights
        highlight_cats = [c for c in results.keys() if c != "All Categories"]
        if not highlight_cats and "All Categories" in results:
            highlight_cats = ["All Categories"]

        for cat in highlight_cats:
            cat_data = results[cat]
            f_vals = cat_data["forecast"]["values"]
            if f_vals:
                cat_tot = round(float(sum(f_vals)), 2)
                max_v = max(f_vals)
                max_idx = f_vals.index(max_v)
                p_month = cat_data["forecast"]["dates"][max_idx]
                category_highlights.append({
                    "category": cat,
                    "predicted_total": cat_tot,
                    "avg_monthly": round(cat_tot / len(f_vals), 2),
                    "peak_month": p_month,
                    "peak_value": round(float(max_v), 2),
                })

        avg_monthly = round(total_forecast / horizon, 2) if horizon > 0 else 0.0
        if last_month_actual > 0:
            growth_pct = round(((avg_monthly - last_month_actual) / last_month_actual * 100), 2)
        else:
            growth_pct = 0.0

        return {
            "total_forecasted_revenue": total_forecast,
            "avg_monthly_forecast": avg_monthly,
            "last_month_actual": last_month_actual,
            "estimated_growth_pct": growth_pct,
            "peak_month": peak_month or "—",
            "peak_month_value": round(float(peak_value), 2),
            "categories_analyzed": len(category_highlights) or len(results),
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

        hist_data = {}
        for cat, df in self.historical.items():
            hist_data[cat] = {
                "dates": df["ds"].dt.strftime("%Y-%m-%d").tolist(),
                "values": df["y"].tolist(),
            }

        with open(directory / "forecaster_historical.json", "w") as f:
            json.dump(hist_data, f, indent=2)

        if PROPHET_AVAILABLE and self.models:
            try:
                from prophet.serialize import model_to_json
                for cat, model in self.models.items():
                    safe_name = cat.replace(" ", "_").replace("/", "_")
                    with open(directory / f"prophet_{safe_name}.json", "w") as f:
                        f.write(model_to_json(model))
            except Exception as e:
                print(f"[Forecaster] Save model note: {e}")

        print(f"[Forecaster] Saved to {directory}")

    def load(self, directory: str):
        """Load a previously saved forecaster."""
        directory = Path(directory)
        hist_path = directory / "forecaster_historical.json"
        if hist_path.exists():
            with open(hist_path, "r") as f:
                hist_data = json.load(f)

            for cat, data in hist_data.items():
                self.historical[cat] = pd.DataFrame({
                    "ds": pd.to_datetime(data["dates"]),
                    "y": data["values"],
                })

        if PROPHET_AVAILABLE:
            try:
                from prophet.serialize import model_from_json
                for file in directory.glob("prophet_*.json"):
                    cat_name = file.stem.replace("prophet_", "").replace("_", " ")
                    with open(file, "r") as f:
                        self.models[cat_name] = model_from_json(f.read())
            except Exception as e:
                print(f"[Forecaster] Load model note: {e}")

        self._is_fitted = True
        print(f"[Forecaster] Loaded from {directory} ({len(self.historical)} categories)")
