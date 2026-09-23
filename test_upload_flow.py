import urllib.request
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

# 1. Login
login_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/login',
    data=json.dumps({'username': 'admin', 'password': 'admin123'}).encode(),
    headers={'Content-Type': 'application/json'}
)
token = json.loads(urllib.request.urlopen(login_req).read().decode())['access_token']

# 2. Sample dataset with 7 rows, 3 categories, 4 customers, and NO returns and NO profit
sample_csv = """OrderDate,StockCode,ProductName,Category,Quantity,UnitPrice,TotalAmount,CustomerID,Country
2024-01-10,SKU-A1,Wireless Noise Cancelling Headphones,Electronics,2,2500.0,5000.0,101,Maharashtra
2024-01-15,SKU-A2,Ergonomic Mechanical Keyboard,Electronics,1,4000.0,4000.0,102,Delhi
2024-02-05,SKU-B1,Cotton Casual Shirt,Fashion,3,800.0,2400.0,101,Maharashtra
2024-02-18,SKU-A1,Wireless Noise Cancelling Headphones,Electronics,4,2500.0,10000.0,103,Karnataka
2024-03-12,SKU-C1,Ceramic Dinner Plate Set,Kitchen,2,1200.0,2400.0,104,Tamil Nadu
2024-03-20,SKU-B1,Cotton Casual Shirt,Fashion,5,800.0,4000.0,102,Delhi
2024-04-10,SKU-A1,Wireless Noise Cancelling Headphones,Electronics,6,2500.0,15000.0,101,Maharashtra
"""
## hell

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="sample_sales.csv"\r\n'
    f'Content-Type: text/csv\r\n\r\n'
    f'{sample_csv}\r\n'
    f'--{boundary}--\r\n'
).encode('utf-8')

upload_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/ingestion/upload-sales-dataset',
    data=body,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }
)
res = urllib.request.urlopen(upload_req)
stats = json.loads(res.read().decode())
print('Upload Result Status:', stats.get('has_dataset'))
print('Total Rows:', stats.get('total_rows'))
print('Total Revenue:', stats.get('total_revenue'))
print('Available Metrics:', stats.get('available_metrics'))

# 3. Check Dataset Status
status_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/ingestion/dataset-status',
    headers={'Authorization': f'Bearer {token}'}
)
meta = json.loads(urllib.request.urlopen(status_req).read().decode())
print('\nDataset Status Check:')
print('  has_dataset:', meta['has_dataset'])
print('  revenue available:', meta['available_metrics']['revenue'])
print('  orders available:', meta['available_metrics']['orders'])
print('  categories available:', meta['available_metrics']['categories'])
print('  customers available:', meta['available_metrics']['customers'])
print('  returns available:', meta['available_metrics']['returns'])
print('  profit available:', meta['available_metrics']['profit'])

# 4. Check Orders Stats
ord_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/orders/stats',
    headers={'Authorization': f'Bearer {token}'}
)
ord_data = json.loads(urllib.request.urlopen(ord_req).read().decode())
print('\nOrder Stats:')
print('  total_orders:', ord_data['total_orders'])
print('  total_revenue:', ord_data['total_revenue'])
print('  average_order_value:', ord_data['average_order_value'])

# 5. Check Customers List
cust_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/customers/',
    headers={'Authorization': f'Bearer {token}'}
)
cust_data = json.loads(urllib.request.urlopen(cust_req).read().decode())
print('\nCustomers Seeded from File:', len(cust_data['customers']))
for c in cust_data['customers']:
    print(f"  CustomerID: {c['customer_id']} | Segment: {c['segment']} | Spent: ₹{c['total_spent']}")

# 6. Check Products Hype
hype_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/analytics/hype-products',
    headers={'Authorization': f'Bearer {token}'}
)
hype_data = json.loads(urllib.request.urlopen(hype_req).read().decode())
print('\nHype Products Seeded from File:', len(hype_data['products']))
for p in hype_data['products']:
    print(f"  Stock: {p['stock_code']} | Desc: {p['description']} | Hype Score: {p['hype_score']} ({p['demand_label']})")

# 7. Check Reset
reset_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/ingestion/reset-dataset',
    data=b'{}',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)
reset_res = json.loads(urllib.request.urlopen(reset_req).read().decode())
print('\nReset Result:', reset_res)

# 8. Check Zero State After Reset
zero_status = json.loads(urllib.request.urlopen(status_req).read().decode())
print('After Reset has_dataset:', zero_status['has_dataset'])

zero_orders = json.loads(urllib.request.urlopen(ord_req).read().decode())
print('After Reset orders:', zero_orders)
