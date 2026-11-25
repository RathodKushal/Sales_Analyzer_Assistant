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
from backend.products.suppliers_router import router as suppliers_router
from backend.returns.router import router as returns_router
from backend.reports.router import router as reports_router
from backend.social.router import router as social_router
from backend.ingestion.router import router as ingestion_router
from backend.powerbi.router import router as powerbi_router
from backend.admin.router import router as admin_router

# Import models so SQLAlchemy knows about them when creating tables
from backend.auth.models import User       # noqa: F401
from backend.customers.models import Customer      # noqa: F401
from backend.orders.models import Order, OrderItem # noqa: F401
from backend.products.models import Product        # noqa: F401
from backend.returns.models import ReturnRecord    # noqa: F401
from backend.ingestion.models import DocumentAnalysis # noqa: F401
from backend.analytics.models import Promotion, MLPrediction # noqa: F401
from backend.admin.models import SystemSetting        # noqa: F401
from backend.admin.service import AdminService

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan — runs on startup and shutdown.
    
    Startup:
      1. Create all database tables
      2. Seed default users (Admin, Users, Manufacturers, Inventory, Purchase_order_items, Quality_inspections)
      3. Seed system settings
      4. Load the ML model into memory
    """
    # ── Startup ─────────────────────────────────────────────
    print("=" * 60)
    print(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    print("=" * 60)

    # 1. Run schema migrations for users and orders tables
    _migrate_user_columns()
    _migrate_order_columns()

    # 2. Create database tables
    Base.metadata.create_all(bind=engine)
    print("[Startup] Database tables created")

    # 3. Purge dummy/seeded customers without real billing purchases
    _cleanup_dummy_customers()

    # 4. Seed default system users
    _seed_system_users()

    # 4. Seed default system settings
    _seed_system_settings()

    # 5. Load ML model (if available)
    try:
        model_service = ModelService.get_instance()
        model_service.load()
        print("[Startup] ML model loaded successfully")
    except FileNotFoundError as e:
        print(f"[Startup] NOTE: {e}")
    except Exception as e:
        print(f"[Startup] NOTE: Failed to load model: {e}")

    # 6. Load Hype RL results
    try:
        model_service = ModelService.get_instance()
        model_service.load_hype_results()
    except Exception as e:
        print(f"[Startup] NOTE: Failed to load hype results: {e}")

    print("[Startup] Server is ready! Zero-state active until user uploads dataset.")
    print("=" * 60)

    yield

    # ── Shutdown ────────────────────────────────────────────
    print("[Shutdown] Server shutting down...")


def _migrate_user_columns():
    """Ensure is_active and last_login columns exist on the users table."""
    import sqlite3
    db_file = PROJECT_ROOT / "sales_analyzer.db"
    if not db_file.exists():
        return
    try:
        conn = sqlite3.connect(str(db_file))
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(users)")
        cols = [r[1] for r in cursor.fetchall()]
        if "is_active" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1")
            conn.commit()
            print("[Startup] Migrated: added 'is_active' column to users")
        if "last_login" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN last_login DATETIME")
            conn.commit()
            print("[Startup] Migrated: added 'last_login' column to users")
        conn.close()
    except Exception as e:
        print(f"[Startup] Migration note: {e}")


def _migrate_order_columns():
    """Ensure billing and invoice columns exist on orders and order_items tables."""
    import sqlite3
    db_file = PROJECT_ROOT / "sales_analyzer.db"
    if not db_file.exists():
        return
    try:
        conn = sqlite3.connect(str(db_file))
        cursor = conn.cursor()

        cursor.execute("PRAGMA table_info(orders)")
        order_cols = [r[1] for r in cursor.fetchall()]
        order_additions = [
            ("subtotal", "FLOAT DEFAULT 0.0"),
            ("tax_amount", "FLOAT DEFAULT 0.0"),
            ("tax_rate", "FLOAT DEFAULT 0.0"),
            ("customer_name", "VARCHAR(100)"),
            ("customer_phone", "VARCHAR(20)"),
            ("customer_email", "VARCHAR(100)"),
            ("invoice_number", "VARCHAR(50)")
        ]
        for col_name, col_type in order_additions:
            if col_name not in order_cols:
                cursor.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}")
                print(f"[Startup] Migrated: added '{col_name}' column to orders")

        cursor.execute("PRAGMA table_info(order_items)")
        item_cols = [r[1] for r in cursor.fetchall()]
        item_additions = [
            ("discount", "FLOAT DEFAULT 0.0"),
            ("product_id", "INTEGER")
        ]
        for col_name, col_type in item_additions:
            if col_name not in item_cols:
                cursor.execute(f"ALTER TABLE order_items ADD COLUMN {col_name} {col_type}")
                print(f"[Startup] Migrated: added '{col_name}' column to order_items")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Startup] Order migration note: {e}")


def _cleanup_dummy_customers():
    """Ensure dummy or unpurchased customers are purged from the database."""
    import sqlite3
    db_file = PROJECT_ROOT / "sales_analyzer.db"
    if not db_file.exists():
        return
    try:
        conn = sqlite3.connect(str(db_file))
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM customers 
            WHERE total_orders <= 0 
               OR customer_id NOT IN (SELECT customer_id FROM orders WHERE invoice_number IS NOT NULL)
        """)
        purged = cursor.rowcount
        conn.commit()
        conn.close()
        if purged > 0:
            print(f"[Startup] Purged {purged} dummy/unpurchased customers from database")
    except Exception as e:
        print(f"[Startup] Customer cleanup note: {e}")


def _seed_system_settings():
    """Ensure default platform settings exist in the database."""
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        AdminService.ensure_default_settings(db)
        print("[Startup] Platform default settings verified")
    except Exception as e:
        print(f"[Startup] Could not seed settings: {e}")
    finally:
        db.close()


def _seed_system_users():
    """Create or update default accounts for all system roles."""
    from sqlalchemy.orm import Session
    from backend.database import SessionLocal
    from backend.auth.models import User
    from backend.auth.utils import hash_password

    users_data = [
        ("admin", "admin@salesanalyzer.local", "admin123", "admin"),
        ("users", "users@salesanalyzer.local", "users123", "users"),
        ("manufacturers", "manufacturers@salesanalyzer.local", "manufacturers123", "manufacturers"),
        ("inventory", "inventory@salesanalyzer.local", "inventory123", "inventory"),
        ("purchase_order_items", "purchase@salesanalyzer.local", "purchase123", "purchase_order_items"),
        ("quality_inspections", "quality@salesanalyzer.local", "quality123", "quality_inspections"),
    ]

    db: Session = SessionLocal()
    try:
        for uname, email, pwd, role in users_data:
            user = db.query(User).filter(User.username == uname).first()
            if not user:
                user = User(
                    username=uname,
                    email=email,
                    hashed_password=hash_password(pwd),
                    role=role,
                    is_active=True,
                )
                db.add(user)
                print(f"[Startup] Created default user: {uname} (role: {role})")
            else:
                user.hashed_password = hash_password(pwd)
                user.role = role
                user.is_active = True
        db.commit()
        print("[Startup] Verified default system role accounts (Admin, Users, Manufacturers, Inventory, Purchase, Quality)")
    except Exception as e:
        db.rollback()
        print(f"[Startup] Could not seed system users: {e}")
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
app.include_router(suppliers_router)
app.include_router(returns_router)
app.include_router(reports_router)
app.include_router(social_router)
app.include_router(ingestion_router)
app.include_router(powerbi_router)
app.include_router(admin_router)


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
