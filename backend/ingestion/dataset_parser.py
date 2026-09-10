"""
Dataset Parser — Single CSV/Excel Upload & Schema Standardizer
===============================================================
Parses any single user-uploaded CSV or Excel sales file, flexibly maps
columns, handles missing columns by filling them with '-', and updates
the database & master dataset file for model re-training and live dashboards.
Also records metric availability for missing data badges ('!').
"""

import pandas as pd
import numpy as np
from pathlib import Path
import os
import re
import json
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session

from backend.orders.models import Order, OrderItem
from backend.products.models import Product
from backend.customers.models import Customer
from backend.returns.models import ReturnRecord


COLUMN_ALIASES = {
    "OrderDate": ["orderdate", "date", "timestamp", "created_at", "txn_date", "transaction_date", "time", "order_date"],
    "StockCode": ["stockcode", "sku", "product_id", "productid", "item_id", "code", "item_code", "product_code"],
    "ProductName": ["productname", "product", "item", "description", "title", "product_title", "name", "item_name"],
    "Category": ["category", "product_category", "department", "group", "type", "category_name"],
    "Quantity": ["quantity", "qty", "units", "count", "items_count", "order_qty"],
    "UnitPrice": ["unitprice", "price", "unit_price", "item_price", "rate", "cost"],
    "TotalAmount": ["totalamount", "total", "amount", "total_price", "revenue", "sales", "line_total", "net_amount"],
    "CustomerID": ["customerid", "customer", "user_id", "client_id", "buyer_id", "user", "cust_id"],
    "Country": ["country", "region", "location", "city", "state", "nation", "address"],
    "Profit": ["profit", "net_profit", "margin", "earnings"],
    "ReturnReason": ["returnreason", "return_reason", "reason", "refund_reason"],
    "ReturnStatus": ["returnstatus", "return_status", "status_return"],
    "RefundAmount": ["refundamount", "refund_amount", "refund", "refunded"],
}


def _clean_header(col_name: str) -> str:
    """Normalize string header for fuzzy matching."""
    return re.sub(r"[^a-z0-9]", "", str(col_name).strip().lower())


def map_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str], list]:
    """
    Flexibly map df columns to canonical standard columns.
    Returns:
        (processed_df, column_mapping_dict, missing_columns_list)
    """
    raw_cols = df.columns.tolist()
    cleaned_map = {_clean_header(col): col for col in raw_cols}

    mapping = {}
    missing = []

    for canonical, aliases in COLUMN_ALIASES.items():
        found = None
        for alias in aliases:
            cleaned_alias = _clean_header(alias)
            if cleaned_alias in cleaned_map:
                found = cleaned_map[cleaned_alias]
                break
        
        if found:
            mapping[canonical] = found
        else:
            missing.append(canonical)

    # Build standardized dataframe
    std_df = pd.DataFrame()

    # 1. OrderDate
    if "OrderDate" in mapping:
        std_df["OrderDate"] = pd.to_datetime(df[mapping["OrderDate"]], errors="coerce")
        std_df["OrderDate"] = std_df["OrderDate"].fillna(pd.Timestamp("2024-01-01"))
    else:
        n_rows = len(df)
        start_date = pd.Timestamp("2024-01-01")
        std_df["OrderDate"] = [start_date + pd.Timedelta(days=i % 365) for i in range(n_rows)]

    # 2. StockCode & ProductName
    if "StockCode" in mapping:
        std_df["StockCode"] = df[mapping["StockCode"]].astype(str).str.strip()
    elif "ProductName" in mapping:
        std_df["StockCode"] = df[mapping["ProductName"]].astype(str).str.strip().str[:10].str.upper()
    else:
        std_df["StockCode"] = [f"SKU-{i+1:04d}" for i in range(len(df))]

    if "ProductName" in mapping:
        std_df["ProductName"] = df[mapping["ProductName"]].astype(str).str.strip()
    else:
        std_df["ProductName"] = std_df["StockCode"]

    # 3. Category (Default: '-')
    if "Category" in mapping:
        std_df["Category"] = df[mapping["Category"]].astype(str).str.strip()
        std_df["Category"] = std_df["Category"].replace(["nan", "None", "null", ""], "-")
    else:
        std_df["Category"] = "-"

    # 4. Quantity (Default: 1)
    if "Quantity" in mapping:
        std_df["Quantity"] = pd.to_numeric(df[mapping["Quantity"]], errors="coerce").fillna(1).astype(int)
        std_df["Quantity"] = std_df["Quantity"].apply(lambda x: max(1, abs(x)))
    else:
        std_df["Quantity"] = 1

    # 5. UnitPrice & TotalAmount
    has_price = "UnitPrice" in mapping
    has_total = "TotalAmount" in mapping

    if has_price:
        std_df["UnitPrice"] = pd.to_numeric(df[mapping["UnitPrice"]], errors="coerce").fillna(100.0)
        std_df["UnitPrice"] = std_df["UnitPrice"].apply(lambda x: max(1.0, abs(x)))
    elif has_total:
        total_vals = pd.to_numeric(df[mapping["TotalAmount"]], errors="coerce").fillna(100.0)
        std_df["UnitPrice"] = (total_vals / std_df["Quantity"]).round(2).apply(lambda x: max(1.0, abs(x)))
    else:
        std_df["UnitPrice"] = 100.0

    if has_total:
        std_df["TotalAmount"] = pd.to_numeric(df[mapping["TotalAmount"]], errors="coerce").fillna(
            std_df["UnitPrice"] * std_df["Quantity"]
        )
    else:
        std_df["TotalAmount"] = (std_df["UnitPrice"] * std_df["Quantity"]).round(2)

    # 6. CustomerID (Default: '-')
    if "CustomerID" in mapping:
        std_df["CustomerID"] = df[mapping["CustomerID"]].astype(str).str.strip()
        std_df["CustomerID"] = std_df["CustomerID"].replace(["nan", "None", "null", ""], "-")
    else:
        std_df["CustomerID"] = "-"

    # 7. Country / State (Default: '-')
    if "Country" in mapping:
        std_df["Country"] = df[mapping["Country"]].astype(str).str.strip()
        std_df["Country"] = std_df["Country"].replace(["nan", "None", "null", ""], "-")
    else:
        std_df["Country"] = "-"

    # 8. Profit (Optional)
    if "Profit" in mapping:
        std_df["Profit"] = pd.to_numeric(df[mapping["Profit"]], errors="coerce").fillna(0.0)
    else:
        std_df["Profit"] = None

    # 9. Returns (Optional)
    if "ReturnReason" in mapping:
        std_df["ReturnReason"] = df[mapping["ReturnReason"]].astype(str).str.strip()
    else:
        std_df["ReturnReason"] = None

    if "RefundAmount" in mapping:
        std_df["RefundAmount"] = pd.to_numeric(df[mapping["RefundAmount"]], errors="coerce").fillna(0.0)
    else:
        std_df["RefundAmount"] = 0.0

    # 10. OrderID
    if "OrderID" in cleaned_map:
        std_df["OrderID"] = df[cleaned_map["OrderID"]].astype(str).str.strip()
    else:
        std_df["OrderID"] = "ORD-" + std_df["OrderDate"].dt.strftime("%Y%m%d") + "-" + (std_df.index + 1).astype(str)

    # Format dates as string
    std_df["OrderDate_Str"] = std_df["OrderDate"].dt.strftime("%Y-%m-%d %H:%M:%S")

    return std_df, mapping, missing


def parse_and_import_single_dataset(file_path: str, db: Session) -> Dict[str, Any]:
    """
    Parse a single CSV or Excel sales file, save standardized master CSV,
    update database records strictly for the uploaded data, and save metadata.
    """
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix in [".xlsx", ".xls"]:
        df = pd.read_excel(path)
    elif suffix == ".csv":
        try:
            df = pd.read_csv(path, encoding="utf-8")
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(path, encoding="latin1")
            except Exception:
                df = pd.read_csv(path, encoding="utf-8", encoding_errors="replace")
    else:
        raise ValueError(f"Unsupported file format '{suffix}'. Please upload a .csv or .xlsx file.")

    if df.empty:
        raise ValueError("Uploaded file is empty.")

    # Process and map columns
    std_df, mapping, missing = map_columns(df)

    project_root = Path(__file__).resolve().parent.parent.parent
    data_dir = project_root / "data"
    data_dir.mkdir(exist_ok=True)

    # Save standardized master dataset
    master_path = data_dir / "uploaded_sales_dataset.csv"
    
    export_df = std_df.copy()
    export_df["OrderDate"] = export_df["OrderDate_Str"]
    export_df.drop(columns=["OrderDate_Str"], errors="ignore", inplace=True)
    export_df.to_csv(master_path, index=False)

    # Check metrics availability
    has_customers = "CustomerID" in mapping and not (std_df["CustomerID"] == "-").all()
    has_categories = "Category" in mapping and not (std_df["Category"] == "-").all()
    has_location = "Country" in mapping and not (std_df["Country"] == "-").all()
    has_profit = "Profit" in mapping and std_df["Profit"] is not None
    
    # Check for return indicators
    has_explicit_returns = "ReturnReason" in mapping and not (std_df["ReturnReason"] == "nan").all()
    has_refunds = "RefundAmount" in mapping and (std_df["RefundAmount"] > 0).any()
    has_returns = bool(has_explicit_returns or has_refunds)

    # Update database tables strictly with this dataset
    try:
        db.query(ReturnRecord).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Product).delete()
        db.query(Customer).delete()
        db.commit()

        # 1. Products
        unique_products = export_df.drop_duplicates(subset=["StockCode"])
        db_products = []
        for _, row in unique_products.iterrows():
            prod_items = export_df[export_df["StockCode"] == row["StockCode"]]
            db_products.append(
                Product(
                    stock_code=str(row["StockCode"]),
                    description=str(row["ProductName"]),
                    category=str(row["Category"]),
                    avg_price=float(prod_items["UnitPrice"].mean()),
                    total_quantity_sold=int(prod_items["Quantity"].sum()),
                    total_revenue=float(prod_items["TotalAmount"].sum()),
                )
            )
        db.bulk_save_objects(db_products)

        # 2. Orders & OrderItems
        unique_orders = export_df.drop_duplicates(subset=["OrderID"])
        db_orders = []
        order_cust_map = {}
        for _, row in unique_orders.iterrows():
            ord_items = export_df[export_df["OrderID"] == row["OrderID"]]
            cust_val = row["CustomerID"]
            cid_int = None
            if has_customers and cust_val != "-":
                # Convert or hash to stable integer ID
                try:
                    cid_int = int(re.sub(r"[^\d]", "", str(cust_val)) or 0)
                except Exception:
                    cid_int = abs(hash(str(cust_val))) % 1000000
            order_cust_map[str(row["OrderID"])] = cid_int

            state_val = str(row["Country"]) if has_location else "Unknown"
            db_orders.append(
                Order(
                    order_id=str(row["OrderID"]),
                    customer_id=cid_int,
                    order_date=pd.to_datetime(row["OrderDate"]),
                    state=state_val,
                    city=state_val,
                    total_amount=float(ord_items["TotalAmount"].sum()),
                    total_items=int(ord_items["Quantity"].sum()),
                    status="Completed",
                    profit_estimate=float(ord_items["Profit"].sum()) if has_profit and "Profit" in ord_items.columns else 0.0,
                )
            )
        db.bulk_save_objects(db_orders)

        db_items = [
            OrderItem(
                order_id=str(row["OrderID"]),
                stock_code=str(row["StockCode"]),
                description=str(row["ProductName"]),
                quantity=int(row["Quantity"]),
                unit_price=float(row["UnitPrice"]),
                line_total=float(row["TotalAmount"]),
            )
            for _, row in export_df.iterrows()
        ]
        db.bulk_save_objects(db_items)

        # 3. Customers (if present in dataset)
        total_customers_seeded = 0
        if has_customers:
            cust_group = export_df[export_df["CustomerID"] != "-"].groupby("CustomerID")
            db_customers = []
            seen_cids = set()

            for raw_cid, c_rows in cust_group:
                try:
                    cid = int(re.sub(r"[^\d]", "", str(raw_cid)) or 0)
                except Exception:
                    cid = abs(hash(str(raw_cid))) % 1000000
                
                if cid in seen_cids or cid == 0:
                    cid = len(seen_cids) + 1
                seen_cids.add(cid)

                total_spent = float(c_rows["TotalAmount"].sum())
                total_ord = int(c_rows["OrderID"].nunique())
                avg_val = total_spent / total_ord if total_ord > 0 else total_spent
                
                # Dynamic RFM Segment derivation from spend & order count
                if total_ord >= 3 and total_spent >= 3000:
                    segment = "Champions"
                elif total_ord >= 2 or total_spent >= 1500:
                    segment = "Loyal"
                elif total_ord == 1 and total_spent < 1000:
                    segment = "New"
                else:
                    segment = "Potential"

                state_val = str(c_rows["Country"].iloc[0]) if has_location else "Unknown"

                db_customers.append(
                    Customer(
                        customer_id=cid,
                        name=f"Customer {cid}",
                        email=f"customer_{cid}@example.com",
                        phone="+919876543210",
                        state=state_val,
                        city=state_val,
                        segment=segment,
                        total_orders=total_ord,
                        total_spent=total_spent,
                        avg_order_value=avg_val,
                        lifetime_value=total_spent,
                    )
                )

            db.bulk_save_objects(db_customers)
            total_customers_seeded = len(db_customers)

        # 4. Returns (if present in dataset)
        total_returns_seeded = 0
        if has_returns:
            db_returns = []
            if has_explicit_returns:
                ret_rows = export_df[export_df["ReturnReason"].notna() & (export_df["ReturnReason"] != "nan")]
                for _, r_row in ret_rows.iterrows():
                    db_returns.append(
                        ReturnRecord(
                            order_id=str(r_row["OrderID"]),
                            customer_id=order_cust_map.get(str(r_row["OrderID"])),
                            return_reason=str(r_row.get("ReturnReason", "Customer Choice")),
                            refund_amount=float(r_row.get("RefundAmount", r_row.get("TotalAmount", 0.0))),
                            return_status="Processed",
                            return_date=pd.to_datetime(r_row["OrderDate"]),
                        )
                    )
            elif has_refunds:
                ref_rows = export_df[export_df["RefundAmount"] > 0]
                for _, r_row in ref_rows.iterrows():
                    db_returns.append(
                        ReturnRecord(
                            order_id=str(r_row["OrderID"]),
                            customer_id=order_cust_map.get(str(r_row["OrderID"])),
                            return_reason="Refund Issued",
                            refund_amount=float(r_row.get("RefundAmount", 0.0)),
                            return_status="Processed",
                            return_date=pd.to_datetime(r_row["OrderDate"]),
                        )
                    )
            if db_returns:
                db.bulk_save_objects(db_returns)
                total_returns_seeded = len(db_returns)

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"[DatasetParser] Database sync note ({e})")

    # Build and save active dataset metadata
    metadata = {
        "has_dataset": True,
        "file_name": path.name,
        "total_rows": len(std_df),
        "total_revenue": float(std_df["TotalAmount"].sum()),
        "total_orders": len(unique_orders),
        "total_products": len(unique_products),
        "total_customers": total_customers_seeded,
        "categories_found": sorted([c for c in std_df["Category"].unique().tolist() if c != "-"]),
        "states_found": sorted([s for s in std_df["Country"].unique().tolist() if s != "-"]),
        "available_metrics": {
            "revenue": True,
            "orders": True,
            "avg_order_value": True,
            "products": True,
            "categories": has_categories,
            "customers": has_customers,
            "returns": has_returns and total_returns_seeded > 0,
            "profit": has_profit,
            "location": has_location,
        },
        "missing_tooltips": {
            "returns": "This data not mentioned in the dataset",
            "customers": "This data not mentioned in the dataset",
            "customer_segments": "This data not mentioned in the dataset",
            "categories": "This data not mentioned in the dataset",
            "profit": "This data not mentioned in the dataset",
            "location": "This data not mentioned in the dataset",
        },
        "date_range": {
            "min": std_df["OrderDate"].min().strftime("%Y-%m-%d"),
            "max": std_df["OrderDate"].max().strftime("%Y-%m-%d"),
        },
    }

    # Write metadata JSON
    meta_path = data_dir / "dataset_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[DatasetParser] Successfully imported dataset '{path.name}'. "
          f"Categories: {has_categories}, Customers: {has_customers}, Returns: {has_returns}")

    return metadata


def clear_active_dataset(db: Session) -> Dict[str, Any]:
    """
    Completely reset dataset and empty business database tables.
    Returns the zero state metadata.
    """
    project_root = Path(__file__).resolve().parent.parent.parent
    data_dir = project_root / "data"

    master_path = data_dir / "uploaded_sales_dataset.csv"
    meta_path = data_dir / "dataset_metadata.json"

    if master_path.exists():
        try:
            os.remove(master_path)
        except Exception:
            pass

    if meta_path.exists():
        try:
            os.remove(meta_path)
        except Exception:
            pass

    try:
        db.query(ReturnRecord).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Product).delete()
        db.query(Customer).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[DatasetParser] Clear database error: {e}")

    return {
        "has_dataset": False,
        "message": "Dataset cleared. System is in zero/null state.",
        "available_metrics": {
            "revenue": False,
            "orders": False,
            "avg_order_value": False,
            "products": False,
            "categories": False,
            "customers": False,
            "returns": False,
            "profit": False,
            "location": False,
        },
    }
