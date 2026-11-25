"""
Database Configuration
=======================
SQLAlchemy engine, session factory, and declarative base for SQLite.
"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from backend.config import get_settings

PROJECT_ROOT = Path(__file__).resolve().parent.parent

settings = get_settings()

db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///./") or db_url == "sqlite:///sales_analyzer.db":
    abs_db_file = (PROJECT_ROOT / "sales_analyzer.db").resolve()
    db_url = f"sqlite:///{abs_db_file.as_posix()}"

# Build engine kwargs based on database type
_engine_kwargs: dict = {"echo": settings.DEBUG}
if db_url.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(db_url, **_engine_kwargs)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base class for all ORM models."""
    pass


def get_db():
    """
    FastAPI dependency that yields a database session.
    Ensures the session is closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
