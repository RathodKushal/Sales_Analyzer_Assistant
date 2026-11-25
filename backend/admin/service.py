"""
Admin Service — Business Logic for Administration & System Metrics
==================================================================
Handles telemetry calculation, user management, and dynamic settings.
"""

import os
import sys
import time
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any

from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

import fastapi
from backend.config import get_settings, PROJECT_ROOT
from backend.auth.models import User
from backend.auth.utils import hash_password
from backend.customers.models import Customer
from backend.orders.models import Order
from backend.products.models import Product
from backend.returns.models import ReturnRecord
from backend.ingestion.models import DocumentAnalysis
from backend.analytics.service import ModelService
from backend.admin.models import SystemSetting

SERVER_START_TIME = time.time()

DEFAULT_SETTINGS: List[Dict[str, Any]] = [
    # General
    {
        "key": "platform_name",
        "value": "ShopFlow CRM Spatial Suite",
        "category": "General",
        "description": "Public branding title displayed across navigation and reports.",
    },
    {
        "key": "support_email",
        "value": "support@shopflow.ai",
        "category": "General",
        "description": "Primary administrator support contact for escalated inquiries.",
    },
    {
        "key": "maintenance_mode",
        "value": "false",
        "category": "General",
        "description": "When enabled, viewers see a maintenance banner across the app.",
    },
    {
        "key": "system_banner_message",
        "value": "ShopFlow CRM — Enterprise Sales Intelligence & Autonomous RL Discounting",
        "category": "General",
        "description": "Global announcement banner shown on all user dashboards.",
    },
    # Security & Access
    {
        "key": "allow_user_registration",
        "value": "true",
        "category": "Security",
        "description": "Permit new self-service accounts to register via login page.",
    },
    {
        "key": "session_timeout_minutes",
        "value": "1440",
        "category": "Security",
        "description": "Duration in minutes before JWT bearer tokens expire (default 24h).",
    },
    {
        "key": "min_password_length",
        "value": "6",
        "category": "Security",
        "description": "Minimum required character length for new user passwords.",
    },
    {
        "key": "enforce_role_strictness",
        "value": "true",
        "category": "Security",
        "description": "Strictly enforce granular permissions on sensitive endpoints.",
    },
    # Analytics & AI
    {
        "key": "default_forecast_months",
        "value": "6",
        "category": "Analytics",
        "description": "Default forecasting horizon window in months for Prophet models.",
    },
    {
        "key": "max_recommended_discount_pct",
        "value": "40",
        "category": "Analytics",
        "description": "Safety threshold ceiling for autonomous reinforcement learning discounts.",
    },
    {
        "key": "enable_model_caching",
        "value": "true",
        "category": "Analytics",
        "description": "Cache inference predictions in memory to minimize latency.",
    },
    {
        "key": "gemini_model_version",
        "value": "gemini-1.5-flash",
        "category": "Analytics",
        "description": "Active Gemini generative AI model tier for social & doc summaries.",
    },
]


class AdminService:
    """Service layer for administrative operations."""

    @staticmethod
    def ensure_default_settings(db: Session):
        """Populate initial system settings if they do not exist."""
        existing_keys = {s.key for s in db.query(SystemSetting.key).all()}
        added = False
        for item in DEFAULT_SETTINGS:
            if item["key"] not in existing_keys:
                db.add(
                    SystemSetting(
                        key=item["key"],
                        value=item["value"],
                        category=item["category"],
                        description=item["description"],
                    )
                )
                added = True
        if added:
            db.commit()

    @staticmethod
    def get_all_settings(db: Session) -> List[Dict[str, Any]]:
        """Fetch all platform settings ordered by category."""
        AdminService.ensure_default_settings(db)
        settings = db.query(SystemSetting).order_by(SystemSetting.category, SystemSetting.key).all()
        return [
            {
                "key": s.key,
                "value": s.value,
                "category": s.category,
                "description": s.description,
                "updated_at": s.updated_at,
            }
            for s in settings
        ]

    @staticmethod
    def update_settings(db: Session, updates: Dict[str, str]) -> List[Dict[str, Any]]:
        """Update multiple system settings at once."""
        for key, value in updates.items():
            setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if setting:
                setting.value = str(value)
                setting.updated_at = datetime.now(timezone.utc)
            else:
                db.add(
                    SystemSetting(
                        key=key,
                        value=str(value),
                        category="Custom",
                        description="Custom platform parameter",
                    )
                )
        db.commit()
        return AdminService.get_all_settings(db)

    @staticmethod
    def reset_settings_to_default(db: Session) -> List[Dict[str, Any]]:
        """Restore settings to hardcoded factory defaults."""
        for item in DEFAULT_SETTINGS:
            setting = db.query(SystemSetting).filter(SystemSetting.key == item["key"]).first()
            if setting:
                setting.value = item["value"]
                setting.description = item["description"]
                setting.updated_at = datetime.now(timezone.utc)
            else:
                db.add(
                    SystemSetting(
                        key=item["key"],
                        value=item["value"],
                        category=item["category"],
                        description=item["description"],
                    )
                )
        db.commit()
        return AdminService.get_all_settings(db)

    @staticmethod
    def get_system_metrics(db: Session) -> Dict[str, Any]:
        """Aggregate system-wide metrics, telemetry, and health info."""
        app_settings = get_settings()

        # 1. User Metrics
        all_users = db.query(User).all()
        total_users = len(all_users)
        active_users = sum(1 for u in all_users if getattr(u, "is_active", True))
        inactive_users = total_users - active_users

        roles_breakdown: Dict[str, int] = {}
        for u in all_users:
            roles_breakdown[u.role] = roles_breakdown.get(u.role, 0) + 1

        # 2. Business Metrics (Computed strictly from billing transactions & purchasers)
        billing_customers_query = db.query(Order.customer_id).filter(Order.invoice_number.isnot(None))
        total_customers = db.query(func.count(Customer.id)).filter(
            Customer.customer_id.in_(billing_customers_query),
            Customer.total_orders > 0
        ).scalar() or 0

        total_orders = db.query(func.count(Order.id)).filter(Order.invoice_number.isnot(None)).scalar() or 0
        total_revenue = db.query(func.sum(Order.total_amount)).filter(Order.invoice_number.isnot(None)).scalar() or 0.0
        avg_order_val = (total_revenue / total_orders) if total_orders > 0 else 0.0
        total_products = db.query(func.count(Product.id)).filter(
            Product.approval_status == "active",
            or_(Product.is_deleted == False, Product.is_deleted == None)
        ).scalar() or 0
        total_returns = db.query(func.count(ReturnRecord.id)).scalar() or 0
        return_rate_pct = (
            (total_returns / total_orders * 100) if total_orders > 0 else 0.0
        )

        # 3. System Telemetry & Database Footprint
        db_size_bytes = 0
        db_file = PROJECT_ROOT / "sales_analyzer.db"
        if db_file.exists():
            try:
                db_size_bytes = db_file.stat().st_size
            except Exception:
                db_size_bytes = 0

        # Formatted DB size
        if db_size_bytes >= 1024 * 1024:
            db_size_formatted = f"{db_size_bytes / (1024 * 1024):.2f} MB"
        elif db_size_bytes >= 1024:
            db_size_formatted = f"{db_size_bytes / 1024:.2f} KB"
        else:
            db_size_formatted = f"{db_size_bytes} Bytes"

        # Model readiness
        model_service = ModelService.get_instance()
        dueling_dqn_ready = bool(getattr(model_service, "_is_loaded", False))
        hype_ready = bool(getattr(model_service, "_hype_loaded", False))

        prophet_ready = False
        try:
            import prophet
            prophet_ready = True
        except ImportError:
            prophet_ready = False

        uptime = time.time() - SERVER_START_TIME

        # 4. Recent Activities Feed
        activities = []
        # Recent user registrations
        recent_users = (
            db.query(User)
            .order_by(User.created_at.desc())
            .limit(4)
            .all()
        )
        for ru in recent_users:
            activities.append(
                {
                    "type": "user_registration",
                    "title": f"User Registered: {ru.username}",
                    "description": f"Role '{ru.role}' assigned ({ru.email})",
                    "timestamp": ru.created_at or datetime.now(timezone.utc),
                    "badge_variant": "success" if ru.role == "admin" else "info",
                }
            )

        # Recent document ingestion
        recent_docs = (
            db.query(DocumentAnalysis)
            .order_by(DocumentAnalysis.created_at.desc())
            .limit(3)
            .all()
        )
        for doc in recent_docs:
            activities.append(
                {
                    "type": "document_upload",
                    "title": f"Data Ingestion: {doc.filename}",
                    "description": f"Processed {doc.file_type} via {doc.analysis_type}",
                    "timestamp": doc.created_at or datetime.now(timezone.utc),
                    "badge_variant": "violet",
                }
            )

        # Sort activities by timestamp desc
        activities.sort(key=lambda x: x["timestamp"], reverse=True)

        return {
            "users": {
                "total_users": total_users,
                "active_users": active_users,
                "inactive_users": inactive_users,
                "roles_breakdown": roles_breakdown,
            },
            "business": {
                "total_orders": total_orders,
                "total_revenue": round(float(total_revenue), 2),
                "average_order_value": round(float(avg_order_val), 2),
                "total_customers": total_customers,
                "total_products": total_products,
                "total_returns": total_returns,
                "return_rate_pct": round(float(return_rate_pct), 2),
            },
            "health": {
                "status": "healthy",
                "app_version": app_settings.APP_VERSION,
                "database_type": "SQLite (WAL Mode)" if "sqlite" in app_settings.DATABASE_URL else "Relational DB",
                "db_size_bytes": db_size_bytes,
                "db_size_formatted": db_size_formatted,
                "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
                "uptime_seconds": round(uptime, 1),
                "model_dueling_dqn": dueling_dqn_ready,
                "model_hype_loaded": hype_ready,
                "model_prophet_ready": prophet_ready,
            },
            "activities": activities[:6],
        }
