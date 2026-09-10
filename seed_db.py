"""
Database Seeder Script — Populate SQLite from data/ CSV files
=============================================================
Loads customers.csv, products.csv, orders.csv, order_items.csv, and returns.csv
into sales_analyzer.db matching SQLAlchemy ORM models.
"""

import sys
import pandas as pd
from pathlib import Path
from datetime import datetime

# Set project root
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import SessionLocal, engine, Base
from backend.customers.models import Customer
from backend.products.models import Product
from backend.orders.models import Order, OrderItem
from backend.returns.models import ReturnRecord


def seed_database():
    print("[Seeder] Creating database tables if needed...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    data_dir = PROJECT_ROOT / "data"

    try:
        print("[Seeder] Clearing old data for fresh seed...")
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Product).delete()
        db.query(Customer).delete()
        db.query(ReturnRecord).delete()
        db.commit()

        print("[Seeder] Reading CSV datasets from data/...")
        
        # 1. Load Products
        products_csv = data_dir / "products.csv"
        if products_csv.exists():
            df_prod = pd.read_csv(products_csv)
            df_prod["StockCode"] = df_prod["StockCode"].astype(str).str.strip()
            df_prod = df_prod.drop_duplicates(subset=["StockCode"])
            print(f"[Seeder] Ingesting {len(df_prod)} products...")
            db_products = []
            for _, row in df_prod.iterrows():
                db_products.append(
                    Product(
                        stock_code=str(row["StockCode"]).strip(),
                        description=str(row.get("Description", "")).strip(),
                        category=str(row.get("Category", "Miscellaneous")).strip(),
                        avg_price=float(row.get("AvgPrice", 100.0)),
                        total_quantity_sold=int(row.get("TotalQuantitySold", 0)),
                        total_revenue=float(row.get("TotalRevenue", 0.0)),
                    )
                )
            db.bulk_save_objects(db_products)
            db.commit()
            print(f"[Seeder] Successfully seeded {len(db_products)} products.")

        # 2. Load Customers
        customers_csv = data_dir / "customers.csv"
        if customers_csv.exists():
            df_cust = pd.read_csv(customers_csv)
            df_cust = df_cust.drop_duplicates(subset=["CustomerID"])
            print(f"[Seeder] Ingesting {len(df_cust)} customers...")
            db_customers = []
            seen_emails = set()
            for _, row in df_cust.iterrows():
                cid = int(row["CustomerID"])
                raw_email = str(row.get("Email", f"customer_{cid}@example.com")).strip().lower()
                if raw_email in seen_emails or not raw_email:
                    email = f"customer_{cid}@example.com"
                else:
                    email = raw_email
                seen_emails.add(email)

                db_customers.append(
                    Customer(
                        customer_id=cid,
                        name=str(row.get("Name", f"Customer {cid}")).strip(),
                        email=email,
                        phone=str(row.get("Phone", "+919876543210")).strip(),
                        gender=str(row.get("Gender", "Unknown")).strip(),
                        age=int(row.get("Age", 30)),
                        state=str(row.get("State", "Unknown")).strip(),
                        city=str(row.get("City", "Unknown")).strip(),
                        pincode=str(row.get("Pincode", "000000")).strip(),
                        segment="Loyal" if cid % 3 == 0 else ("Champions" if cid % 2 == 0 else "New"),
                        total_orders=1,
                        total_spent=5000.0,
                        avg_order_value=500.0,
                        lifetime_value=5000.0,
                    )
                )
            db.bulk_save_objects(db_customers)
            db.commit()
            print(f"[Seeder] Successfully seeded {len(db_customers)} customers.")

        # 3. Load Orders
        orders_csv = data_dir / "orders.csv"
        if orders_csv.exists():
            df_ord = pd.read_csv(orders_csv)
            df_ord["OrderID"] = df_ord["OrderID"].astype(str).str.strip()
            df_ord = df_ord.drop_duplicates(subset=["OrderID"])
            print(f"[Seeder] Ingesting {len(df_ord)} orders...")
            db_orders = []
            for _, row in df_ord.iterrows():
                order_date = pd.to_datetime(row["OrderDate"], errors="coerce")
                if pd.isna(order_date):
                    order_date = datetime.now()
                db_orders.append(
                    Order(
                        order_id=str(row["OrderID"]).strip(),
                        customer_id=int(row["CustomerID"]) if pd.notna(row.get("CustomerID")) else None,
                        order_date=order_date,
                        state=str(row.get("State", "Unknown")).strip(),
                        city=str(row.get("City", "Unknown")).strip(),
                        total_amount=float(row.get("TotalAmount", 0.0)),
                        total_items=int(row.get("TotalItems", 1)),
                        status=str(row.get("Status", "Completed")).strip(),
                        discount_applied=float(row.get("Discount", 0.0)),
                        profit_estimate=float(row.get("Profit", 0.0)),
                    )
                )
            # Batch save in chunks of 5000
            chunk_size = 5000
            for i in range(0, len(db_orders), chunk_size):
                db.bulk_save_objects(db_orders[i:i + chunk_size])
                db.commit()
            print(f"[Seeder] Successfully seeded {len(db_orders)} orders.")

        # 4. Load Order Items
        items_csv = data_dir / "order_items.csv"
        if items_csv.exists():
            df_items = pd.read_csv(items_csv)
            print(f"[Seeder] Ingesting {len(df_items)} order items...")
            db_items = []
            for _, row in df_items.iterrows():
                db_items.append(
                    OrderItem(
                        order_id=str(row["OrderID"]).strip(),
                        stock_code=str(row["StockCode"]).strip(),
                        description=str(row.get("Description", "")).strip(),
                        quantity=int(row.get("Quantity", 1)),
                        unit_price=float(row.get("UnitPrice", 0.0)),
                        line_total=float(row.get("LineTotal", float(row.get("Quantity", 1)) * float(row.get("UnitPrice", 0.0)))),
                    )
                )
            for i in range(0, len(db_items), chunk_size):
                db.bulk_save_objects(db_items[i:i + chunk_size])
                db.commit()
            print(f"[Seeder] Successfully seeded {len(db_items)} order items.")

        # 5. Load Returns
        returns_csv = data_dir / "returns.csv"
        if returns_csv.exists():
            df_ret = pd.read_csv(returns_csv)
            print(f"[Seeder] Ingesting {len(df_ret)} return records...")
            db_returns = []
            for _, row in df_ret.iterrows():
                ret_date = pd.to_datetime(row.get("ReturnDate"), errors="coerce")
                if pd.isna(ret_date):
                    ret_date = datetime.now()
                db_returns.append(
                    ReturnRecord(
                        order_id=str(row["OrderID"]).strip(),
                        customer_id=int(row["CustomerID"]) if pd.notna(row.get("CustomerID")) else None,
                        return_reason=str(row.get("ReturnReason", "Customer Choice")).strip(),
                        refund_amount=float(row.get("RefundAmount", 0.0)),
                        return_status=str(row.get("ReturnStatus", "Processed")).strip(),
                        return_date=ret_date,
                    )
                )
            db.bulk_save_objects(db_returns)
            db.commit()
            print(f"[Seeder] Successfully seeded {len(db_returns)} returns.")

        print("[Seeder] Database seeding complete!")

    except Exception as e:
        db.rollback()
        print(f"[Seeder] ERROR during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
