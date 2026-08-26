"""
Quick API test script — validates all backend endpoints.
"""
import requests
import json

BASE = "http://127.0.0.1:8000/api"

def test_all():
    print("=" * 50)
    print("  Sales Analyzer API — Endpoint Tests")
    print("=" * 50)

    # 1. Root
    print("\n[1] Root endpoint...")
    r = requests.get("http://127.0.0.1:8000/")
    assert r.status_code == 200
    print(f"    OK: {r.json()}")

    # 2. Health
    print("\n[2] Health check...")
    r = requests.get(f"{BASE}/health")
    assert r.status_code == 200
    health = r.json()
    print(f"    OK: status={health['status']}, model_loaded={health['model_loaded']}")

    # 3. Login
    print("\n[3] Login as admin...")
    r = requests.post(f"{BASE}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert r.status_code == 200, f"Login failed: {r.text}"
    data = r.json()
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"    OK: token={token[:40]}...")
    print(f"    User: {data['user']['username']} ({data['user']['role']})")

    # 4. Profile
    print("\n[4] Get profile (auth required)...")
    r = requests.get(f"{BASE}/auth/me", headers=headers)
    assert r.status_code == 200
    print(f"    OK: {r.json()['username']} / {r.json()['email']}")

    # 5. Unauthorized test
    print("\n[5] Unauthorized access test...")
    r = requests.get(f"{BASE}/auth/me")
    assert r.status_code in [401, 403]
    print(f"    OK: correctly rejected with {r.status_code}")

    # 6. Model summary
    print("\n[6] Model evaluation summary...")
    r = requests.get(f"{BASE}/analytics/summary", headers=headers)
    print(f"    Status: {r.status_code}")
    if r.status_code == 200:
        s = r.json()
        print(f"    Profit Improvement: {s['profit_improvement_pct']:.1f}%")
        print(f"    Positive Profit Rate: {s['agent_positive_profit_rate']:.1f}%")
    else:
        print(f"    (Model may not be loaded: {r.text[:100]})")

    # 7. Predict discount
    print("\n[7] Predict optimal discount...")
    r = requests.post(f"{BASE}/analytics/predict", headers=headers, json={
        "ship_mode": "Standard Class",
        "segment": "Consumer",
        "region": "West",
        "category": "Technology",
        "sub_category": "Phones",
        "quantity": 3,
        "sales": 249.99,
        "discount": 0.2
    })
    print(f"    Status: {r.status_code}")
    if r.status_code == 200:
        p = r.json()
        print(f"    Recommended Discount: {p['recommended_discount']}")
        print(f"    Confidence: {p['confidence']:.4f}")
        print(f"    Q-Values: {json.dumps(p['q_values'], indent=6)}")
    else:
        print(f"    (Prediction may have failed: {r.text[:200]})")

    # 8. Discount bins
    print("\n[8] Discount bins...")
    r = requests.get(f"{BASE}/analytics/discount-bins", headers=headers)
    print(f"    Status: {r.status_code}")
    if r.status_code == 200:
        print(f"    Bins: {r.json()['discount_bins']}")

    # 9. Create a sales record
    print("\n[9] Create sales record...")
    r = requests.post(f"{BASE}/sales/", headers=headers, json={
        "order_date": "2024-06-15",
        "segment": "Consumer",
        "region": "West",
        "category": "Technology",
        "sub_category": "Phones",
        "sales": 249.99,
        "quantity": 3,
        "discount": 0.1,
        "profit": 45.50
    })
    assert r.status_code == 201, f"Create failed: {r.text}"
    print(f"    OK: Record #{r.json()['id']} created")

    # 10. List sales
    print("\n[10] List sales records...")
    r = requests.get(f"{BASE}/sales/", headers=headers)
    assert r.status_code == 200
    sales_data = r.json()
    print(f"    OK: {sales_data['total']} record(s), page {sales_data['page']}/{sales_data['total_pages']}")

    # 11. Sales stats
    print("\n[11] Sales stats...")
    r = requests.get(f"{BASE}/sales/stats", headers=headers)
    assert r.status_code == 200
    stats = r.json()
    print(f"    Total Records: {stats['total_records']}")
    print(f"    Total Sales: ${stats['total_sales']:.2f}")
    print(f"    Total Profit: ${stats['total_profit']:.2f}")

    # 12. Reports stub
    print("\n[12] Reports stub...")
    r = requests.get(f"{BASE}/reports/generate", headers=headers)
    assert r.status_code == 200
    print(f"    OK: {r.json()['status']}")

    # 13. Social stub
    print("\n[13] Social content stub...")
    r = requests.post(f"{BASE}/social/generate-content", headers=headers, json={
        "product_category": "Technology",
        "campaign_type": "product_launch"
    })
    assert r.status_code == 200
    print(f"    OK: {r.json()['status']}")

    # 14. Register new user
    print("\n[14] Register new user...")
    r = requests.post(f"{BASE}/auth/register", json={
        "username": "test_viewer",
        "email": "viewer@test.com",
        "password": "viewer123",
        "role": "viewer"
    })
    if r.status_code == 201:
        print(f"    OK: User '{r.json()['username']}' created with role '{r.json()['role']}'")
    elif r.status_code == 409:
        print(f"    OK: User already exists (idempotent)")
    else:
        print(f"    Status: {r.status_code} - {r.text[:100]}")

    print("\n" + "=" * 50)
    print("  ALL TESTS COMPLETED!")
    print("=" * 50)
    print(f"\n  Swagger UI: http://localhost:8000/docs")
    print(f"  ReDoc:      http://localhost:8000/redoc\n")


if __name__ == "__main__":
    test_all()
