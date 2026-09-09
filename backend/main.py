"""
Sales Analyzer API — Main Application
=========================================
FastAPI application entry point.

Start with:
    uvicorn backend.main:app --reload

Swagger docs at:
    http://localhost:8000/docs
"""

import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is on sys.path for model imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import get_settings
from backend.database import engine, Base
from backend.analytics.service import ModelService

# Import routers
from backend.auth.router import router as auth_router
from backend.analytics.router import router as analytics_router
from backend.customers.router import router as customers_router
from backend.orders.router import router as orders_router
from backend.products.router import router as products_router
from backend.returns.router import router as returns_router
from backend.reports.router import router as reports_router
from backend.social.router import router as social_router
from backend.ingestion.router import router as ingestion_router
from backend.powerbi.router import router as powerbi_router

# Import models so SQLAlchemy knows about them when creating tables
from backend.auth.models import User       # noqa: F401
from backend.customers.models import Customer      # noqa: F401
from backend.orders.models import Order, OrderItem # noqa: F401
from backend.products.models import Product        # noqa: F401
from backend.returns.models import ReturnRecord    # noqa: F401
from backend.ingestion.models import DocumentAnalysis # noqa: F401

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan — runs on startup and shutdown.
    
    Startup:
      1. Create all database tables
      2. Seed a default admin user (if none exists)
      3. Load the ML model into memory
    """
    # ── Startup ─────────────────────────────────────────────
    print("=" * 60)
    print(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    print("=" * 60)

    # 1. Create database tables
    Base.metadata.create_all(bind=engine)
    print("[Startup] Database tables created")

    # 2. Seed default admin user
    _seed_admin_user()

    # 3. Load ML model
    try:
        model_service = ModelService.get_instance()
        model_service.load()
        print("[Startup] ML model loaded successfully")
    except FileNotFoundError as e:
        print(f"[Startup] WARNING: {e}")
        print("[Startup] Model endpoints will return errors until the model is trained.")
    except Exception as e:
        print(f"[Startup] WARNING: Failed to load model: {e}")

    # 4. Load Hype RL results (independent of DQN discount model)
    try:
        model_service = ModelService.get_instance()
        model_service.load_hype_results()
    except Exception as e:
        print(f"[Startup] WARNING: Failed to load hype results: {e}")

    print("[Startup] Server is ready!")
    print("=" * 60)

    yield

    # ── Shutdown ────────────────────────────────────────────
    print("[Shutdown] Server shutting down...")


def _seed_admin_user():
    """Create a default admin user if no users exist yet."""
    from sqlalchemy.orm import Session
    from backend.database import SessionLocal
    from backend.auth.models import User
    from backend.auth.utils import hash_password

    db: Session = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            admin = User(
                username="admin",
                email="admin@salesanalyzer.local",
                hashed_password=hash_password("admin123"),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print("[Startup] Default admin user created (admin / admin123)")
        else:
            print(f"[Startup] {user_count} user(s) already exist — skipping seed")
    finally:
        db.close()


# ── Create the FastAPI app ──────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Backend API for the Sales Analyzer platform. "
        "Serves the trained DQN reinforcement learning model for discount optimization, "
        "manages sales records, and provides endpoints for reports and AI content generation."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ─────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ────────────────────────────────────────

app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(products_router)
app.include_router(returns_router)
app.include_router(reports_router)
app.include_router(social_router)
app.include_router(ingestion_router)
app.include_router(powerbi_router)


# ── Root / Health Check ─────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """Root endpoint — confirms the API is running."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint for monitoring."""
    model_service = ModelService.get_instance()
    return {
        "status": "healthy",
        "model_loaded": model_service._is_loaded,
        "version": settings.APP_VERSION,
    }
