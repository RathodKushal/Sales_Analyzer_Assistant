"""
Demand Analyzer — Unified Product Demand Intelligence
======================================================
Combines the Hype RL model predictions with the Prophet-based
Sales Forecaster to produce comprehensive demand analysis reports.

Features:
  - Per-product demand signals (from Hype RL: Severe Drop → Viral)
  - Category-level revenue forecasts (from Prophet)
  - Seasonal demand patterns (peak months per category)
  - Top rising / declining products ranking
  - Demand score distribution
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional
import json


class DemandAnalyzer:
    """
    Combines Hype RL predictions + Sales Forecaster outputs
    into a unified demand analysis report for e-commerce.

    Attributes:
        hype_results: dict of product-level hype predictions
        forecast_results: dict of category-level forecasts
    """

    # Hype bin labels and color codes
    HYPE_LABELS = {
        0: {"label": "Severe Drop", "color": "#ef4444", "emoji": "📉"},
        1: {"label": "Declining", "color": "#f97316", "emoji": "⬇️"},
        2: {"label": "Steady", "color": "#eab308", "emoji": "➡️"},
        3: {"label": "Growing", "color": "#22c55e", "emoji": "📈"},
        4: {"label": "Viral/Hype", "color": "#8b5cf6", "emoji": "🔥"},
    }

    def __init__(self):
        self.hype_results: Optional[dict] = None
        self.forecast_results: Optional[dict] = None

    def load_hype_results(self, hype_path: str) -> bool:
        """Load hype evaluation results from JSON."""
        path = Path(hype_path)
        if not path.exists():
            print(f"[DemandAnalyzer] Hype results not found at {path}")
            return False

        with open(path, "r") as f:
            self.hype_results = json.load(f)
        print(f"[DemandAnalyzer] Loaded hype results for "
              f"{len(self.hype_results.get('product_predictions', {}))} products")
        return True

    def load_forecast_results(self, forecast_data: dict):
        """Accept pre-computed forecast results from SalesForecaster."""
        self.forecast_results = forecast_data
        print(f"[DemandAnalyzer] Loaded forecast results for "
              f"{forecast_data.get('horizon_months', '?')} month horizon")

    def analyze(self, data_dir: Optional[str] = None) -> dict:
        """
        Produce a comprehensive demand analysis report.

        Returns:
            Dict with demand signals, trends, and recommendations.
        """
        product_signals = self._analyze_product_demand()
        has_data = len(product_signals) > 0

        report = {
            "product_demand_signals": product_signals,
            "category_forecast_summary": self._analyze_category_forecasts(),
            "seasonal_patterns": self._analyze_seasonal_patterns(data_dir),
            "top_rising_products": self._get_top_products("rising", limit=10),
            "top_declining_products": self._get_top_products("declining", limit=10),
            "demand_distribution": self._get_demand_distribution(),
            "recommendations": self._generate_recommendations(),
            "has_data": has_data,
            "notice": "Demand signals and recommendations live from billing orders." if has_data else "No billing transactions recorded yet. Complete sales in Billing/POS to activate Demand Intelligence."
        }

        return report

    def _analyze_product_demand(self) -> list[dict]:
        """Extract and rank product demand signals from hype predictions."""
        if not self.hype_results:
            return []

        predictions = self.hype_results.get("product_predictions", {})
        signals = []

        for stock_code, data in predictions.items():
            pred_bin = data.get("predicted_bin", 2)
            actual_growth = data.get("actual_growth", 0.0)
            hist_sales = data.get("historical_sales", [])
            stock = int(data.get("stock", 0))
            total_sold = int(data.get("total_sold", 0))

            bin_info = self.HYPE_LABELS.get(pred_bin, self.HYPE_LABELS[2])

            # Compute demand score (0-100)
            score = {0: 10, 1: 30, 2: 50, 3: 75, 4: 95}.get(pred_bin, 50)

            # Determine stock status
            if stock == 0 and total_sold > 0:
                stock_status = "Out of Stock"
            elif stock < 10 and pred_bin >= 3:
                stock_status = "Low Stock / High Demand"
            elif stock > 50 and total_sold == 0:
                stock_status = "Overstocked"
            else:
                stock_status = f"{stock} in stock"

            signals.append({
                "stock_code": stock_code,
                "description": data.get("description", f"Product {stock_code}"),
                "category": data.get("category", "General"),
                "stock": stock,
                "total_sold": total_sold,
                "stock_status": stock_status,
                "demand_score": score,
                "demand_label": bin_info["label"],
                "demand_emoji": bin_info["emoji"],
                "demand_color": bin_info["color"],
                "predicted_bin": pred_bin,
                "actual_growth_pct": round(actual_growth * 100, 2),
                "historical_sales": hist_sales,
                "target_month": data.get("target_month", ""),
            })

        # Sort by demand score descending
        signals.sort(key=lambda x: x["demand_score"], reverse=True)
        return signals

    def _analyze_category_forecasts(self) -> list[dict]:
        """Summarize category-level forecasts."""
        if not self.forecast_results:
            return []

        forecasts = self.forecast_results.get("forecasts", {})
        summaries = []

        for cat, data in forecasts.items():
            hist = data.get("historical", {})
            fcast = data.get("forecast", {})

            hist_values = hist.get("values", [])
            fcast_values = fcast.get("values", [])

            # Compute growth trend
            if hist_values and fcast_values:
                last_hist = hist_values[-1]
                avg_forecast = np.mean(fcast_values)
                growth_pct = (
                    ((avg_forecast - last_hist) / last_hist * 100)
                    if last_hist > 0 else 0
                )
            else:
                growth_pct = 0

            summaries.append({
                "category": cat,
                "historical_months": len(hist_values),
                "forecast_months": len(fcast_values),
                "last_actual_revenue": hist_values[-1] if hist_values else 0,
                "avg_forecasted_revenue": round(np.mean(fcast_values), 2) if fcast_values else 0,
                "total_forecasted_revenue": round(sum(fcast_values), 2) if fcast_values else 0,
                "growth_trend_pct": round(growth_pct, 2),
                "forecast_dates": fcast.get("dates", []),
                "forecast_values": fcast_values,
                "forecast_lower": fcast.get("lower_bound", []),
                "forecast_upper": fcast.get("upper_bound", []),
            })

        summaries.sort(key=lambda x: x["growth_trend_pct"], reverse=True)
        return summaries

    def _analyze_seasonal_patterns(self, data_dir: Optional[str]) -> dict:
        """Analyze seasonal demand patterns from historical data."""
        if not self.forecast_results:
            return {"monthly_patterns": {}}

        # Aggregate seasonal patterns from historical data
        monthly_totals = {}  # month_number -> total revenue

        forecasts = self.forecast_results.get("forecasts", {})
        for cat, data in forecasts.items():
            if cat == "All Categories":
                continue
            hist_dates = data.get("historical", {}).get("dates", [])
            hist_values = data.get("historical", {}).get("values", [])

            for date_str, value in zip(hist_dates, hist_values):
                try:
                    month = int(date_str.split("-")[1])
                    if month not in monthly_totals:
                        monthly_totals[month] = {"total": 0, "count": 0, "categories": {}}
                    monthly_totals[month]["total"] += value
                    monthly_totals[month]["count"] += 1

                    if cat not in monthly_totals[month]["categories"]:
                        monthly_totals[month]["categories"][cat] = 0
                    monthly_totals[month]["categories"][cat] += value
                except (ValueError, IndexError):
                    continue

        # Find peak month per category
        month_names = [
            "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ]

        monthly_patterns = {}
        for month_num in sorted(monthly_totals.keys()):
            data = monthly_totals[month_num]
            avg_revenue = data["total"] / max(data["count"], 1)

            # Find top category for this month
            top_cat = max(
                data["categories"].items(),
                key=lambda x: x[1],
                default=("Unknown", 0)
            )

            monthly_patterns[month_names[month_num]] = {
                "month_number": month_num,
                "avg_revenue": round(avg_revenue, 2),
                "top_category": top_cat[0],
                "top_category_revenue": round(top_cat[1], 2),
            }

        # Identify peak and low seasons
        if monthly_patterns:
            peak_month = max(monthly_patterns.items(), key=lambda x: x[1]["avg_revenue"])
            low_month = min(monthly_patterns.items(), key=lambda x: x[1]["avg_revenue"])
        else:
            peak_month = ("N/A", {"avg_revenue": 0})
            low_month = ("N/A", {"avg_revenue": 0})

        return {
            "monthly_patterns": monthly_patterns,
            "peak_season": peak_month[0],
            "peak_season_revenue": peak_month[1]["avg_revenue"],
            "low_season": low_month[0],
            "low_season_revenue": low_month[1]["avg_revenue"],
        }

    def _get_top_products(self, direction: str, limit: int = 10) -> list[dict]:
        """Get top rising or declining products from hype predictions."""
        if not self.hype_results:
            return []

        predictions = self.hype_results.get("product_predictions", {})
        products = []

        for stock_code, data in predictions.items():
            products.append({
                "stock_code": stock_code,
                "description": data.get("description", f"Product {stock_code}"),
                "category": data.get("category", "General"),
                "stock": int(data.get("stock", 0)),
                "total_sold": int(data.get("total_sold", 0)),
                "growth_pct": round(data.get("actual_growth", 0) * 100, 2),
                "predicted_bin": data.get("predicted_bin", 2),
                "label": self.HYPE_LABELS.get(
                    data.get("predicted_bin", 2), self.HYPE_LABELS[2]
                )["label"],
                "historical_sales": data.get("historical_sales", []),
            })

        if direction == "rising":
            products.sort(key=lambda x: x["growth_pct"], reverse=True)
        else:
            products.sort(key=lambda x: x["growth_pct"])

        return products[:limit]

    def _get_demand_distribution(self) -> dict:
        """Get the distribution of demand scores across all products."""
        if not self.hype_results:
            return {"bins": {}, "total_products": 0}

        predictions = self.hype_results.get("product_predictions", {})
        bin_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}

        for data in predictions.values():
            pred_bin = data.get("predicted_bin", 2)
            bin_counts[pred_bin] = bin_counts.get(pred_bin, 0) + 1

        distribution = {}
        for bin_id, count in bin_counts.items():
            info = self.HYPE_LABELS.get(bin_id, self.HYPE_LABELS[2])
            distribution[info["label"]] = {
                "count": count,
                "color": info["color"],
                "emoji": info["emoji"],
            }

        return {
            "bins": distribution,
            "total_products": len(predictions),
        }

    def _generate_recommendations(self) -> list[dict]:
        """Generate actionable recommendations based on analysis."""
        recommendations = []

        # 1. Product Stock vs Demand recommendations
        if self.hype_results:
            predictions = self.hype_results.get("product_predictions", {})
            for code, p in predictions.items():
                stock = int(p.get("stock", 0))
                sold = int(p.get("total_sold", 0))
                desc = p.get("description", f"Product {code}")
                pred_bin = p.get("predicted_bin", 2)

                if stock == 0 and sold > 0:
                    recommendations.append({
                        "type": "warning",
                        "priority": "high",
                        "title": f"🚨 Stockout Alert: {desc}",
                        "description": (
                            f"Product {code} ({desc}) is completely out of stock with {sold} units "
                            "sold in billing. Create a purchase order to replenish inventory immediately."
                        ),
                    })
                elif stock <= 5 and pred_bin >= 3:
                    recommendations.append({
                        "type": "opportunity",
                        "priority": "high",
                        "title": f"⚡ Low Stock & High Demand: {desc}",
                        "description": (
                            f"Product {code} shows positive momentum ({self.HYPE_LABELS.get(pred_bin, {}).get('label', 'Growing')}) "
                            f"with only {stock} units in stock. Reorder soon to avoid disruption."
                        ),
                    })
                elif stock >= 50 and sold == 0:
                    recommendations.append({
                        "type": "info",
                        "priority": "medium",
                        "title": f"📦 Overstocked Inventory: {desc}",
                        "description": (
                            f"Product {code} has {stock} units in inventory but 0 recent billing sales. "
                            "Consider applying AI-recommended discounts to accelerate turnover."
                        ),
                    })

            viral_count = sum(
                1 for p in predictions.values()
                if p.get("predicted_bin", 2) >= 3
            )
            declining_count = sum(
                1 for p in predictions.values()
                if p.get("predicted_bin", 2) <= 1
            )

            if viral_count > 0 and not any(r["title"].startswith("🔥") for r in recommendations):
                recommendations.append({
                    "type": "opportunity",
                    "priority": "high",
                    "title": f"🔥 {viral_count} products trending upward",
                    "description": (
                        f"{viral_count} products show Growing or Viral demand signals. "
                        "Prioritize stock availability and sales promotion for these items."
                    ),
                })

            if declining_count > 0 and not any(r["title"].startswith("⚠️") for r in recommendations):
                recommendations.append({
                    "type": "warning",
                    "priority": "medium",
                    "title": f"⚠️ {declining_count} products showing declining demand",
                    "description": (
                        f"{declining_count} products show declining or drop demand. "
                        "Evaluate discounting strategy or reduce future purchase order quantities."
                    ),
                })

        # Based on forecasts
        if self.forecast_results:
            summary = self.forecast_results.get("summary", {})
            growth = summary.get("estimated_growth_pct", 0)

            if growth > 5:
                recommendations.append({
                    "type": "opportunity",
                    "priority": "high",
                    "title": f"📈 Revenue growth projected at +{growth:.1f}%",
                    "description": (
                        "The forecast shows strong revenue growth. "
                        "Ensure supply chain and inventory can handle increased demand."
                    ),
                })
            elif growth < -5:
                recommendations.append({
                    "type": "warning",
                    "priority": "high",
                    "title": f"📉 Revenue decline projected at {growth:.1f}%",
                    "description": (
                        "The forecast indicates declining revenue. "
                        "Consider promotional campaigns, new product launches, "
                        "or expanding into new customer segments."
                    ),
                })

            peak_month = summary.get("peak_month", "")
            if peak_month:
                recommendations.append({
                    "type": "info",
                    "priority": "medium",
                    "title": f"📅 Peak revenue month: {peak_month}",
                    "description": (
                        f"Predicted peak revenue in {peak_month}. "
                        "Plan inventory buildup and marketing campaigns "
                        "at least 4-6 weeks before this period."
                    ),
                })

        if not recommendations:
            recommendations.append({
                "type": "info",
                "priority": "low",
                "title": "ℹ️ Insufficient data for recommendations",
                "description": (
                    "Train the forecaster and hype models to generate "
                    "actionable demand insights."
                ),
            })

        return recommendations
