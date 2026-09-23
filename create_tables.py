import sys
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import engine, Base
from backend.customers.models import Customer, Address, Wishlist, Review, CartItem
from backend.products.models import Product, Category, Brand, Inventory, Supplier
from backend.orders.models import Order, OrderItem, Payment, ShippingMethod, Shipment
from backend.returns.models import ReturnRecord
from backend.analytics.models import Promotion, MLPrediction
from backend.auth.models import User
from backend.ingestion.models import DocumentAnalysis

Base.metadata.create_all(bind=engine)
print("Tables created successfully.")
