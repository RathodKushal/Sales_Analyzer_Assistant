import os
import time
import json
import urllib.request
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'screenshots')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_auth(username, password):
    url = 'http://127.0.0.1:8000/api/auth/login'
    data = json.dumps({'username': username, 'password': password}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            return res.get('access_token'), json.dumps(res.get('user', {}))
    except Exception as e:
        print(f"Auth error for {username}: {e}")
        return None, None

def main():
    print("Capturing authentication tokens for all roles...")
    creds = {
        'admin': ('admin', 'admin123'),
        'inventory': ('inventory', 'inventory123'),
        'purchase': ('purchase_order_items', 'purchase123'),
        'manufacturer': ('manufacturers', 'manufacturers123'),
        'quality': ('quality_inspections', 'quality123'),
        'user': ('users', 'users123')
    }

    tokens = {}
    for role_name, (uname, pwd) in creds.items():
        tok, usr = get_auth(uname, pwd)
        tokens[role_name] = (tok, usr)
        print(f"Role '{role_name}': token acquired = {bool(tok)}")

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1560,1050')

    driver = webdriver.Chrome(options=options)

    # 1. Login Page
    print("\n1. Capturing Login Page...")
    driver.get('http://localhost:5174/login')
    time.sleep(2)
    driver.save_screenshot(os.path.join(OUTPUT_DIR, '01_login_page.png'))

    # Helper function to capture an authenticated page
    def capture_page(role_name, path, filename, wait_sec=2.5, post_action=None):
        tok, usr = tokens[role_name]
        if not tok:
            print(f"Skipping {filename}: no token for {role_name}")
            return
        driver.get('http://localhost:5174/login')
        driver.execute_script("localStorage.setItem('access_token', arguments[0]); localStorage.setItem('user', arguments[1]);", tok, usr)
        driver.get(f'http://localhost:5174{path}')
        time.sleep(wait_sec)
        if post_action:
            try:
                post_action(driver)
                time.sleep(1)
            except Exception as e:
                print(f"Post action warning for {filename}: {e}")
        driver.save_screenshot(os.path.join(OUTPUT_DIR, filename))
        print(f"Saved: {filename}")

    # 2. Admin Dashboard
    print("2. Capturing Admin Master Control Center...")
    capture_page('admin', '/admin', '02_admin_dashboard.png', wait_sec=3)

    # 3. Inventory Dashboard
    print("3. Capturing Warehouse & Inventory Hub...")
    capture_page('inventory', '/dashboard/inventory', '03_inventory_hub.png', wait_sec=3)

    # 4. Purchase Order Dashboard
    print("4. Capturing Procurement & Purchase Orders Dashboard...")
    capture_page('purchase', '/dashboard/purchase-orders', '04_purchase_orders.png', wait_sec=3)

    # 5. Manufacturer Portal
    print("5. Capturing Manufacturer & VMI Portal...")
    capture_page('manufacturer', '/dashboard/manufacturers', '05_manufacturer_portal.png', wait_sec=3)

    # 6. Quality Inspections
    print("6. Capturing Quality Assurance & Inspections...")
    capture_page('quality', '/dashboard/quality-inspections', '06_quality_assurance.png', wait_sec=3)

    # 7. POS Billing Terminal
    print("7. Capturing POS Billing Terminal...")
    capture_page('purchase', '/billing', '07_pos_billing.png', wait_sec=3)

    # 8. Customers Directory
    print("8. Capturing Customers Directory...")
    capture_page('admin', '/customers', '08_customers_directory.png', wait_sec=2.5)

    # 9. Products Catalog
    print("9. Capturing Products Catalog...")
    capture_page('admin', '/products', '09_products_catalog.png', wait_sec=2.5)

    # 10. Discount AI
    print("10. Capturing Discount AI (DDQN)...")
    capture_page('admin', '/discount-ai', '10_discount_ai.png', wait_sec=3)

    # 11. Product Hype AI
    print("11. Capturing Product Hype AI...")
    capture_page('admin', '/hype-ai', '11_product_hype_ai.png', wait_sec=3)

    # 12. Sales Forecast
    print("12. Capturing Sales Forecast (Prophet)...")
    capture_page('admin', '/forecast', '12_sales_forecast.png', wait_sec=3)

    # 13. Demand Analysis
    print("13. Capturing Demand Analysis...")
    capture_page('admin', '/demand', '13_demand_analysis.png', wait_sec=3)

    driver.quit()
    print("\nAll 13 UI screenshots successfully captured in screenshots/ directory!")

if __name__ == '__main__':
    main()
