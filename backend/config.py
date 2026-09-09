"""
Application Configuration
==========================
Reads settings from environment variables / .env file.
Uses pydantic-settings for validation and type coercion.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


# Resolve the project root (one level above /backend)
PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application settings — loaded from .env or environment variables."""

    # ── App ─────────────────────────────────────────────────────
    APP_NAME: str = "ShopFlow CRM API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── Security ────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production-use-a-real-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ── Database ────────────────────────────────────────────────
    DATABASE_URL: str = "mysql+pymysql://root:@localhost/sales_analyzer"

    # Data and Model Settings
    DATA_PATH: Path = Path(os.getenv("DATA_PATH", "../data"))
    MODEL_PATH: Path = Path(os.getenv("MODEL_PATH", "../model/saved/best"))
    SQLITE_PATH: str = os.getenv("SQLITE_PATH", "sqlite:///./shopflow_crm.db")

    # ── CORS ────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",     # React CRA default
        "http://localhost:5173",     # Vite default
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # ── Gemini (stub — for future use) ──────────────────────────
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = PROJECT_ROOT / "backend" / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton — avoids re-reading .env on every call."""
    return Settings()
