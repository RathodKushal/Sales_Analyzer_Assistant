import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_full_suite():
    session = requests.Session()
    login_res = session.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initial reset to start from clean zero state
    session.post(f"{BASE_URL}/api/ingestion/reset-dataset", headers=headers)

    print("=== 1. VERIFY ZERO/NULL STATE ON LOGIN ===")
    status = session.get(f"{BASE_URL}/api/ingestion/dataset-status", headers=headers).json()
    orders = session.get(f"{BASE_URL}/api/orders/stats", headers=headers).json()
    returns = session.get(f"{BASE_URL}/api/returns/stats", headers=headers).json()
    customers = session.get(f"{BASE_URL}/api/customers/", headers=headers).json()
    hype = session.get(f"{BASE_URL}/api/analytics/hype-products", headers=headers).json()
    meta = session.get(f"{BASE_URL}/api/analytics/dataset-meta", headers=headers).json()
    forecast = session.get(f"{BASE_URL}/api/analytics/forecast?months=3", headers=headers).json()
    demand = session.get(f"{BASE_URL}/api/analytics/demand-analysis", headers=headers).json()

    print(f"has_dataset: {status.get('has_dataset')} (Expected: False)")
    print(f"total_revenue: {orders.get('total_revenue')} (Expected: 0.0)")
    print(f"total_orders: {orders.get('total_orders')} (Expected: 0)")
    print(f"avg_order_value: {orders.get('average_order_value')} (Expected: 0.0)")
    print(f"returns has_data: {returns.get('has_data')} (Expected: False)")
    print(f"return_rate: {returns.get('return_rate_percentage')} (Expected: 0.0)")
    print(f"customers count: {customers.get('total')} (Expected: 0)")
    print(f"hype products count: {hype.get('total')} (Expected: 0)")
    print(f"demand analysis categories: {demand.get('categories')} (Expected: None or [])")
    print(f"forecast categories: {forecast.get('categories')} (Expected: None or [])")

    assert status.get("has_dataset") is False
    assert orders.get("total_orders") == 0
    assert orders.get("total_revenue") == 0.0
    assert returns.get("has_data") is False
    assert customers.get("total") == 0
    assert hype.get("total") == 0

    print("\n=== 2. UPLOAD DATASET WITHOUT RETURNS/PROFIT ===")
    with open("sample_sales_without_returns.csv", "rb") as f:
        files = {"file": ("sample_sales_without_returns.csv", f, "text/csv")}
        up_res = session.post(f"{BASE_URL}/api/ingestion/upload-sales-dataset", files=files, headers=headers)
        assert up_res.status_code == 200, f"Upload failed: {up_res.text}"
        data = up_res.json()

    print(f"Uploaded successfully. Total rows: {data.get('total_rows')}")
    print(f"Available metrics: {data.get('available_metrics')}")
    print(f"Missing tooltips: {data.get('missing_tooltips')}")

    assert data["available_metrics"]["revenue"] is True
    assert data["available_metrics"]["orders"] is True
    assert data["available_metrics"]["customers"] is True
    assert data["available_metrics"]["returns"] is False
    assert data["available_metrics"]["profit"] is False
    assert data["missing_tooltips"]["returns"] == "This data not mentioned in the dataset"

    print("\n=== 3. VERIFY ALL 7 TABS AFTER UPLOAD ===")
    orders_post = session.get(f"{BASE_URL}/api/orders/stats", headers=headers).json()
    customers_post = session.get(f"{BASE_URL}/api/customers/", headers=headers).json()
    hype_post = session.get(f"{BASE_URL}/api/analytics/hype-products", headers=headers).json()
    meta_post = session.get(f"{BASE_URL}/api/analytics/dataset-meta", headers=headers).json()
    demand_post = session.get(f"{BASE_URL}/api/analytics/demand-analysis", headers=headers).json()

    cust_list = customers_post.get("customers", [])
    hype_list = hype_post.get("products", [])
    print(f"Tab Orders -> total: {orders_post['total_orders']}, revenue: ₹{orders_post['total_revenue']}")
    print(f"Tab Customers -> total: {len(cust_list)}, segments: {[c['segment'] for c in cust_list]}")
    print(f"Tab Hype AI -> products: {[p['description'] for p in hype_list]}")
    print(f"Tab Discount AI -> categories: {meta_post['categories']}, states: {meta_post['states']}")
    print(f"Tab Demand Analysis -> total products tracked: {demand_post.get('total_products')}")

    assert orders_post["total_orders"] == 7
    assert orders_post["total_revenue"] == 42800.0
    assert len(cust_list) == 4
    assert len(hype_list) == 4
    assert "Electronics" in meta_post["categories"]
    assert "Fashion" in meta_post["categories"]

    print("\n=== 4. TEST RESET TO ZERO STATE ===")
    reset_res = session.post(f"{BASE_URL}/api/ingestion/reset-dataset", headers=headers).json()
    print(f"Reset response: {reset_res['message']}")
    assert reset_res["has_dataset"] is False

    orders_reset = session.get(f"{BASE_URL}/api/orders/stats", headers=headers).json()
    print(f"Orders after reset: total={orders_reset['total_orders']}, revenue={orders_reset['total_revenue']}")
    assert orders_reset["total_orders"] == 0
    assert orders_reset["total_revenue"] == 0.0

    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_suite()
