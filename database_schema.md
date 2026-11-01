# Unified Database Schema (Sales Analyzer Assistant + AI-MINI-PROJECT + Role Actors)

This document specifies the unified database schema combining:
1. **Sales Analyzer Assistant** (Core e-commerce analytics, customer 360, orders, reviews, shipments, ML predictions).
2. **AI-MINI-PROJECT** (Multi-tenant company architecture, procurement, purchase orders, notifications).
3. **Actor Extensions (from Screenshots)**:
   - **Manufacturer**: Vendor-Managed Inventory (VMI) Replenishment, Catalog & Product Management.
   - **Inventory Manager**: Day-to-Day Stock Control & Movements, Sales Order Fulfillment.
   - **Purchase Manager**: Manufacturer Onboarding, Supplier Evaluations, PO Execution, Margin & Pricing Optimization, Supply Chain Tracking.
   - **Quality Assurance (QA)**: Product Quality Checks, Return Inspections & Disposition.
   - **System Actors**: Custom ML Analytics Model Registry & Daily Automated Retraining/Continuous Learning Logs.

---

## I. Modified Existing Tables

---

### **[Table 1: Users]**
> *Modified: Added `Company_id`, `Phone`, `Is_active`, and extended `Role` to support all screenshot actors.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the user |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id) | Multi-tenant organization reference |
| 3 | Username | VARCHAR(50) | NOT NULL, UNIQUE | User's unique login username |
| 4 | Email | VARCHAR(100) | NOT NULL, UNIQUE | User's email address |
| 5 | Hashed_password | VARCHAR(255) | NOT NULL | Securely hashed password |
| 6 | Role | VARCHAR(50) | NOT NULL | Role: 'admin', 'staff', 'manufacturer', 'inventory_manager', 'purchase_manager', 'qa_inspector', 'customer' |
| 7 | Phone | VARCHAR(20) |  | Contact telephone number |
| 8 | Is_active | BOOLEAN | DEFAULT TRUE | Account operational status |
| 9 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp of creation |

<br>

### **[Table 2: Customers]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the customer |
| 2 | Customer_id | INTEGER |  | Legacy / external customer reference ID |
| 3 | Name | VARCHAR(100) |  | Customer's full name |
| 4 | Email | VARCHAR(100) |  | Customer's email address |
| 5 | Phone | VARCHAR(20) |  | Customer's phone number |
| 6 | Gender | VARCHAR(20) |  | Customer's gender |
| 7 | Age | INTEGER |  | Customer's age |
| 8 | State | VARCHAR(100) |  | State or province |
| 9 | City | VARCHAR(100) |  | City |
| 10 | Pincode | VARCHAR(20) |  | Postal code |
| 11 | Segment | VARCHAR(50) |  | Segment: High-Value, Churn-Risk, Regular |
| 12 | Total_orders | INTEGER | DEFAULT 0 | Cumulative completed orders count |
| 13 | Total_spent | FLOAT | DEFAULT 0.0 | Lifetime revenue generated |
| 14 | Avg_order_value | FLOAT | DEFAULT 0.0 | Average order spend |
| 15 | Return_rate | FLOAT | DEFAULT 0.0 | Frequency of returned orders ratio |
| 16 | First_purchase_date | DATETIME |  | First order date |
| 17 | Last_purchase_date | DATETIME |  | Most recent order date |
| 18 | Lifetime_value | FLOAT |  | Predicted Customer Lifetime Value (CLV) |
| 19 | Churn_risk_score | FLOAT |  | ML predicted churn probability (0.0 - 1.0) |
| 20 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp of record creation |
| 21 | Updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp of latest update |

<br>

### **[Table 3: Products]**
> *Modified: Added `Company_id`, `Sku`, `Manufacturer_id`, `Cost_price`, `Selling_price`, and `Min_order_quantity` for Manufacturer & Purchase Manager catalog tracking.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the product |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id) | Multi-tenant organization reference |
| 3 | Sku | VARCHAR(100) | UNIQUE | Stock Keeping Unit |
| 4 | Stock_code | VARCHAR(50) |  | Primary stock or legacy code |
| 5 | Manufacturer_id | INTEGER | FOREIGN KEY (Manufacturers.Id) | Associated manufacturing partner |
| 6 | Description | VARCHAR(255) |  | Product title and specification |
| 7 | Category | VARCHAR(100) |  | Primary product category |
| 8 | Cost_price | FLOAT | DEFAULT 0.0 | Procurement / manufacturing cost per unit |
| 9 | Selling_price | FLOAT | DEFAULT 0.0 | Retail / catalog list price |
| 10 | Avg_price | FLOAT |  | Historical average selling price |
| 11 | Min_order_quantity | INTEGER | DEFAULT 1 | Minimum order threshold (MOQ) |
| 12 | Total_quantity_sold | INTEGER | DEFAULT 0 | Cumulative units sold |
| 13 | Total_revenue | FLOAT | DEFAULT 0.0 | Cumulative sales revenue generated |
| 14 | Return_rate | FLOAT | DEFAULT 0.0 | Historical return rate percentage |
| 15 | Popularity_rank | INTEGER |  | Ranking calculated from sales volume |

<br>

### **[Table 4: Orders]**
> *Modified: Added `Company_id`, `Fulfillment_status`, and `Assigned_inventory_manager_id` for Inventory Manager sales fulfillment tracking.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique internal record identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id) | Multi-tenant organization reference |
| 3 | Order_id | VARCHAR(50) | NOT NULL, UNIQUE | Business-facing order number |
| 4 | Customer_id | INTEGER | FOREIGN KEY (Customers.Id) | Customer who placed the order |
| 5 | Order_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp order was placed |
| 6 | State | VARCHAR(100) |  | Delivery state |
| 7 | City | VARCHAR(100) |  | Delivery city |
| 8 | Total_amount | FLOAT | NOT NULL | Final invoice total |
| 9 | Total_items | INTEGER | NOT NULL | Item count in order |
| 10 | Status | VARCHAR(50) | DEFAULT 'pending' | Order status: 'pending', 'paid', 'cancelled', 'refunded' |
| 11 | Fulfillment_status | VARCHAR(50) | DEFAULT 'unfulfilled' | Inventory fulfillment: 'unfulfilled', 'picking', 'packed', 'dispatched', 'delivered' |
| 12 | Assigned_inventory_manager_id | INTEGER | FOREIGN KEY (Users.Id) | Inventory manager supervising fulfillment |
| 13 | Discount_applied | FLOAT | DEFAULT 0.0 | Discount deduction applied |
| 14 | Payment_method | VARCHAR(50) |  | Mode of payment (Credit Card, UPI, NetBanking) |
| 15 | Profit_estimate | FLOAT |  | Estimated net profit on this order |

<br>

### **[Table 5: Document_analysis]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique record identifier |
| 2 | User_id | INTEGER | FOREIGN KEY (Users.Id) | User who uploaded the document |
| 3 | Filename | VARCHAR(255) | NOT NULL | Uploaded document filename |
| 4 | File_type | VARCHAR(50) |  | PDF, CSV, Excel, Image |
| 5 | Raw_text | TEXT |  | OCR or parsed extracted raw text |
| 6 | Structured_insights | JSON |  | AI extracted key-value pairs & analytics |
| 7 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ingestion timestamp |

<br>

### **[Table 6: Order_items]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique line-item identifier |
| 2 | Order_id | VARCHAR(50) | FOREIGN KEY (Orders.Order_id) | Parent order reference |
| 3 | Stock_code | VARCHAR(50) |  | Product stock identifier |
| 4 | Description | VARCHAR(200) |  | Line item description |
| 5 | Quantity | INTEGER | NOT NULL | Units purchased |
| 6 | Unit_price | FLOAT | NOT NULL | Price charged per unit |
| 7 | Line_total | FLOAT | NOT NULL | Quantity * Unit_price minus line discount |
| 8 | Is_returned | BOOLEAN | DEFAULT FALSE | Flag indicating if this specific item was returned |

<br>

### **[Table 7: Returns]**
> *Modified: Added `Company_id`, `Qa_inspection_status`, and `Disposition` for QA returns management.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique return record identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id) | Multi-tenant organization reference |
| 3 | Order_id | VARCHAR(50) | FOREIGN KEY (Orders.Order_id) | Original order reference |
| 4 | Customer_id | INTEGER | FOREIGN KEY (Customers.Id) | Requesting customer |
| 5 | Return_reason | VARCHAR(200) |  | Reason stated by customer |
| 6 | Refund_amount | FLOAT |  | Amount approved or refunded |
| 7 | Return_status | VARCHAR(50) | DEFAULT 'requested' | 'requested', 'in_inspection', 'approved', 'rejected', 'completed' |
| 8 | Qa_inspection_status | VARCHAR(50) | DEFAULT 'pending_qa' | QA workflow status: 'pending_qa', 'qa_passed', 'qa_failed', 'reconditioned' |
| 9 | Disposition | VARCHAR(50) |  | Action: 'restock', 'refurbish', 'scrap', 'return_to_manufacturer' |
| 10 | Return_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | Return initiation date |

<br>

### **[Table 8: Addresses]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique address identifier |
| 2 | Customer_id | INTEGER | FOREIGN KEY (Customers.Id) | Associated customer |
| 3 | Address_line_1 | VARCHAR(255) | NOT NULL | Building, street, flat |
| 4 | Address_line_2 | VARCHAR(255) |  | Landmark, area |
| 5 | City | VARCHAR(100) | NOT NULL | City |
| 6 | State | VARCHAR(100) | NOT NULL | State / Province |
| 7 | Pincode | VARCHAR(20) | NOT NULL | Postal code |
| 8 | Is_default | BOOLEAN | DEFAULT FALSE | Default billing/shipping address flag |

<br>

### **[Table 9: Wishlists]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique wishlist entry identifier |
| 2 | Customer_id | INTEGER | FOREIGN KEY (Customers.Id) | Associated customer |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id) | Product saved to wishlist |
| 4 | Added_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date product was bookmarked |

<br>

### **[Table 10: Reviews]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique review identifier |
| 2 | Customer_id | INTEGER | FOREIGN KEY (Customers.Id) | Review author |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id) | Reviewed product |
| 4 | Rating | INTEGER | NOT NULL | Star rating (1 - 5) |
| 5 | Review_text | TEXT |  | Customer review text |
| 6 | Sentiment_score | FLOAT |  | NLP computed sentiment score (-1.0 to 1.0) |
| 7 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Review submission timestamp |

<br>

### **[Table 11: Cart_items]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique cart item entry identifier |
| 2 | Customer_id | INTEGER | FOREIGN KEY (Customers.Id) | Customer holding the cart |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id) | Product in cart |
| 4 | Quantity | INTEGER | NOT NULL, DEFAULT 1 | Number of units in cart |
| 5 | Added_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | Added timestamp |

<br>

### **[Table 12: Categories]**
> *Modified: Added `Company_id` for multi-tenant catalog partitioning.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique category identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id) | Multi-tenant organization reference |
| 3 | Name | VARCHAR(100) | NOT NULL | Category name |
| 4 | Description | VARCHAR(200) |  | Category description |
| 5 | Parent_category_id | INTEGER | FOREIGN KEY (Categories.Id) | Parent category for hierarchy |

<br>

### **[Table 13: Brands]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique brand identifier |
| 2 | Name | VARCHAR(100) | NOT NULL | Brand trade name |
| 3 | Manufacturer | VARCHAR(100) |  | Manufacturer company name |
| 4 | Country_of_origin | VARCHAR(50) |  | Country of origin |

<br>

### **[Table 14: Inventory]**
> *Modified: Added `Company_id`, `Reserved_stock`, `Available_stock`, and `Bin_location` for Inventory Manager stock control.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique inventory record identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id) | Multi-tenant organization reference |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id) | Associated product |
| 4 | Warehouse_location | VARCHAR(100) | NOT NULL | Warehouse facility or zone |
| 5 | Bin_location | VARCHAR(50) |  | Specific aisle/rack/shelf |
| 6 | Stock_level | INTEGER | NOT NULL, DEFAULT 0 | Total on-hand physical units |
| 7 | Reserved_stock | INTEGER | DEFAULT 0 | Units reserved for open orders |
| 8 | Available_stock | INTEGER | DEFAULT 0 | Free uncommitted stock (Stock_level - Reserved_stock) |
| 9 | Reorder_threshold | INTEGER | DEFAULT 10 | Stock floor triggering reorder alert |
| 10 | Last_restock_date | DATETIME |  | Timestamp of most recent inbound delivery |

<br>

### **[Table 15: Suppliers]**
> *Modified: Added `Company_id`, `Supplier_type`, `Onboarding_status`, `Contact_person`, `Payment_terms`, `Lead_time_days`, and `Evaluation_score` for Purchase Manager supplier onboarding & performance evaluation.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique supplier identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id) | Multi-tenant organization reference |
| 3 | Name | VARCHAR(150) | NOT NULL | Supplier / vendor enterprise name |
| 4 | Supplier_type | VARCHAR(50) | DEFAULT 'manufacturer' | Type: 'manufacturer', 'distributor', 'wholesaler' |
| 5 | Onboarding_status | VARCHAR(50) | DEFAULT 'active' | 'onboarding', 'verified', 'active', 'under_review', 'suspended' |
| 6 | Contact_person | VARCHAR(100) |  | Key account executive name |
| 7 | Contact_email | VARCHAR(100) | NOT NULL | Official contact email |
| 8 | Contact_phone | VARCHAR(20) |  | Direct phone number |
| 9 | Payment_terms | VARCHAR(100) |  | E.g. 'Net 30', 'Net 60', 'Advance 50%' |
| 10 | Lead_time_days | INTEGER | DEFAULT 7 | Average delivery turnaround in days |
| 11 | Rating | FLOAT | DEFAULT 5.0 | Supplier star rating (1.0 to 5.0) |
| 12 | Evaluation_score | FLOAT |  | Performance evaluation composite score (0-100) |

<br>

### **[Table 16: Payments]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique payment transaction identifier |
| 2 | Order_id | VARCHAR(50) | FOREIGN KEY (Orders.Order_id) | Associated customer order |
| 3 | Payment_method | VARCHAR(50) | NOT NULL | Payment gateway / instrument |
| 4 | Amount | FLOAT | NOT NULL | Transaction charge amount |
| 5 | Transaction_id | VARCHAR(100) | UNIQUE | Gateway reference / utr number |
| 6 | Payment_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | Transaction completion timestamp |
| 7 | Status | VARCHAR(50) | DEFAULT 'completed' | 'initiated', 'completed', 'failed', 'refunded' |

<br>

### **[Table 17: Shipping_methods]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique shipping method identifier |
| 2 | Name | VARCHAR(100) | NOT NULL | Carrier service tier (Standard, Express, Overnight) |
| 3 | Cost | FLOAT | NOT NULL | Base shipping rate |
| 4 | Estimated_days | INTEGER | NOT NULL | Guaranteed delivery window in business days |

<br>

### **[Table 18: Promotions]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique promotion identifier |
| 2 | Code | VARCHAR(50) | NOT NULL, UNIQUE | Coupon or promotion coupon code |
| 3 | Description | VARCHAR(200) |  | Campaign marketing summary |
| 4 | Discount_percentage | FLOAT | NOT NULL | Percentage off list price |
| 5 | Start_date | DATETIME | NOT NULL | Promotion validity start timestamp |
| 6 | End_date | DATETIME | NOT NULL | Promotion validity expiration timestamp |
| 7 | Is_active | BOOLEAN | DEFAULT TRUE | Master promotional toggle |
| 8 | Ai_recommended | BOOLEAN | DEFAULT FALSE | Flag indicating if generated by ML demand model |

<br>

### **[Table 19: Ml_predictions]**
> *Modified: Added `Company_id` and `Model_id` to link with the System Actor's ML Model Registry.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique inference result identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id) | Multi-tenant organization reference |
| 3 | Model_id | INTEGER | FOREIGN KEY (Ml_models.Id) | Registered ML Model version used for inference |
| 4 | Model_name | VARCHAR(100) | NOT NULL | Model designation (e.g., 'demand_forecaster_v2') |
| 5 | Target_entity_id | VARCHAR(100) | NOT NULL | Referenced product ID, customer ID, or SKU |
| 6 | Prediction_type | VARCHAR(50) | NOT NULL | 'demand_forecast', 'churn_risk', 'restock_urgency', 'price_elasticity' |
| 7 | Prediction_value | FLOAT | NOT NULL | Numerical prediction output |
| 8 | Confidence_score | FLOAT |  | Statistical confidence interval (0.0 to 1.0) |
| 9 | Features_used | JSON |  | Input feature vectors / context payload |
| 10 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Inference execution timestamp |

<br>

### **[Table 20: Shipments]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique outbound shipment identifier |
| 2 | Order_id | VARCHAR(50) | FOREIGN KEY (Orders.Order_id) | Customer order being dispatched |
| 3 | Shipping_method_id | INTEGER | FOREIGN KEY (Shipping_methods.Id) | Selected delivery service |
| 4 | Tracking_number | VARCHAR(100) | UNIQUE | Carrier consignment tracking code |
| 5 | Status | VARCHAR(50) | DEFAULT 'manifested' | 'manifested', 'in_transit', 'out_for_delivery', 'delivered', 'returned' |
| 6 | Shipped_date | DATETIME |  | Dispatched timestamp |
| 7 | Estimated_delivery | DATETIME |  | Estimated customer arrival date |

---

## II. New Tables Added from AI-MINI-PROJECT

---

### **[Table 21: Companies]**
> *Source: AI-MINI-PROJECT core multi-tenant entity.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique tenant company identifier |
| 2 | Name | VARCHAR(255) | NOT NULL | Registered company / business name |
| 3 | Low_stock_threshold | INTEGER | DEFAULT 10 | Company-wide default alert threshold for low stock |
| 4 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Onboarding timestamp |

<br>

### **[Table 22: Purchase_orders]**
> *Source: AI-MINI-PROJECT procurement & Purchase Manager PO Execution.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique purchase order identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id), NOT NULL | Multi-tenant organization reference |
| 3 | Supplier_id | INTEGER | FOREIGN KEY (Suppliers.Id), NOT NULL | Supplier or manufacturer fulfilling the PO |
| 4 | Po_number | VARCHAR(50) | NOT NULL, UNIQUE | Formal Purchase Order number (e.g., 'PO-2026-001') |
| 5 | Status | VARCHAR(50) | DEFAULT 'pending' | 'draft', 'pending', 'approved', 'issued', 'partially_received', 'fulfilled', 'cancelled' |
| 6 | Total_amount | FLOAT | DEFAULT 0.0 | Cumulative total cost of PO items |
| 7 | Issued_date | DATETIME |  | Date PO was officially dispatched to supplier |
| 8 | Expected_delivery_date | DATETIME |  | Supplier agreed delivery timeline |
| 9 | Created_by | INTEGER | FOREIGN KEY (Users.Id) | Purchase manager user who created the PO |
| 10 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

<br>

### **[Table 23: Purchase_order_items]**
> *Source: AI-MINI-PROJECT procurement line items.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique PO line item identifier |
| 2 | Purchase_order_id | INTEGER | FOREIGN KEY (Purchase_orders.Id), NOT NULL | Parent purchase order reference |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id), NOT NULL | Ordered catalog product |
| 4 | Quantity | INTEGER | NOT NULL | Quantity of units ordered |
| 5 | Cost | FLOAT | NOT NULL | Unit procurement cost agreed with supplier |
| 6 | Received_quantity | INTEGER | DEFAULT 0 | Quantity inspected and received in warehouse |

<br>

### **[Table 24: Notifications]**
> *Source: AI-MINI-PROJECT system notification and proactive alert engine.*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique notification identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id), NOT NULL | Multi-tenant organization reference |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id) | Referenced product (optional) |
| 4 | Message | TEXT | NOT NULL | Alert or recommendation text message |
| 5 | Type | VARCHAR(50) | DEFAULT 'info' | 'info', 'warning', 'low_stock', 'po_update', 'qa_alert', 'vmi_replenishment' |
| 6 | Is_read | BOOLEAN | DEFAULT FALSE | Has notification been viewed by staff |
| 7 | Action_taken | BOOLEAN | DEFAULT FALSE | Has user resolved / acted on the recommendation |
| 8 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Dispatch timestamp |

---

## III. New Tables Added from Screenshot 1 & 2 Roles

---

### **[Table 25: Manufacturers]**
> *Role: Manufacturer & Purchase Manager (Onboarding new manufacturers, contact info, catalog).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique manufacturer identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id), NOT NULL | Multi-tenant organization reference |
| 3 | Name | VARCHAR(200) | NOT NULL | Manufacturer corporate entity name |
| 4 | Manufacturer_code | VARCHAR(50) | NOT NULL, UNIQUE | Standardized manufacturer code |
| 5 | Contact_person | VARCHAR(100) |  | Primary account liaison |
| 6 | Email | VARCHAR(100) | NOT NULL | Manufacturer contact email |
| 7 | Phone | VARCHAR(50) |  | Telephone / emergency contact |
| 8 | Address | TEXT |  | Factory / head office postal address |
| 9 | Country | VARCHAR(100) |  | Country of production |
| 10 | Compliance_status | VARCHAR(50) | DEFAULT 'under_review' | 'certified', 'under_review', 'non_compliant' |
| 11 | Onboarding_status | VARCHAR(50) | DEFAULT 'pending' | 'pending', 'approved', 'active', 'rejected' |
| 12 | Vmi_enabled | BOOLEAN | DEFAULT FALSE | Enables proactive Vendor-Managed Inventory replenishment |
| 13 | Lead_time_days | INTEGER | DEFAULT 14 | Standard manufacturing lead time |
| 14 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Onboarding creation date |

<br>

### **[Table 26: Manufacturer_catalogs]**
> *Role: Manufacturer (Product and Catalog Management).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique catalog item identifier |
| 2 | Manufacturer_id | INTEGER | FOREIGN KEY (Manufacturers.Id), NOT NULL | Originating manufacturer |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id) | Linked internal product ID (if onboarded) |
| 4 | Manufacturer_sku | VARCHAR(100) | NOT NULL | Manufacturer's OEM catalog SKU |
| 5 | Catalog_item_name | VARCHAR(200) | NOT NULL | Official item name in vendor catalog |
| 6 | Specifications | JSON |  | Technical specs, dimensions, material attributes |
| 7 | Unit_cost | FLOAT | NOT NULL | Wholesale supply price |
| 8 | Moq | INTEGER | DEFAULT 1 | Minimum order quantity required by manufacturer |
| 9 | Production_lead_time_days | INTEGER | DEFAULT 7 | Production turnaround days |
| 10 | Is_active | BOOLEAN | DEFAULT TRUE | Active offering in manufacturer's live catalog |

<br>

### **[Table 27: Vmi_replenishments]**
> *Role: Manufacturer (Proactive Inventory Replenishment / Vendor-Managed Inventory).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique VMI replenishment request identifier |
| 2 | Company_id | INTEGER | FOREIGN KEY (Companies.Id), NOT NULL | Multi-tenant organization reference |
| 3 | Manufacturer_id | INTEGER | FOREIGN KEY (Manufacturers.Id), NOT NULL | Responsible manufacturer proposing replenishment |
| 4 | Product_id | INTEGER | FOREIGN KEY (Products.Id), NOT NULL | Product being proactively restocked |
| 5 | Current_stock_snapshot | INTEGER | NOT NULL | Stock level at time of replenishment calculation |
| 6 | Suggested_replenishment_qty | INTEGER | NOT NULL | Quantity calculated by manufacturer's replenishment algorithm |
| 7 | Approved_replenishment_qty | INTEGER |  | Final quantity authorized by retailer |
| 8 | Trigger_rule | VARCHAR(50) | DEFAULT 'min_threshold' | Rule trigger: 'min_threshold', 'ai_demand_forecast', 'scheduled_cycle' |
| 9 | Status | VARCHAR(50) | DEFAULT 'proposed' | 'proposed', 'approved', 'in_production', 'dispatched', 'received' |
| 10 | Dispatch_date | DATETIME |  | Expected or actual shipment date |
| 11 | Delivery_eta | DATETIME |  | Target warehouse arrival timestamp |
| 12 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Replenishment proposal timestamp |

<br>

### **[Table 28: Inventory_adjustments]**
> *Role: Inventory Manager (Day to Day Stock Control).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique stock adjustment audit record ID |
| 2 | Inventory_id | INTEGER | FOREIGN KEY (Inventory.Id), NOT NULL | Warehouse inventory bin reference |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id), NOT NULL | Affected product |
| 4 | Adjustment_type | VARCHAR(50) | NOT NULL | 'cycle_count', 'damage_writeoff', 'shrinkage', 'restock_inbound', 'manual_reconciliation' |
| 5 | Quantity_change | INTEGER | NOT NULL | Net quantity delta (+/-) |
| 6 | Quantity_before | INTEGER | NOT NULL | Physical stock level before adjustment |
| 7 | Quantity_after | INTEGER | NOT NULL | Resulting physical stock level after adjustment |
| 8 | Reason | VARCHAR(255) |  | Operational justification / incident notes |
| 9 | Performed_by | INTEGER | FOREIGN KEY (Users.Id), NOT NULL | Inventory manager conducting the count/adjustment |
| 10 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Adjustment audit timestamp |

<br>

### **[Table 29: Sales_fulfillments]**
> *Role: Inventory Manager (Overseeing Sales Fulfillment).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique fulfillment batch record ID |
| 2 | Order_id | VARCHAR(50) | FOREIGN KEY (Orders.Order_id), NOT NULL | Customer order being fulfilled |
| 3 | Inventory_manager_id | INTEGER | FOREIGN KEY (Users.Id), NOT NULL | Inventory manager in charge of fulfillment line |
| 4 | Fulfillment_stage | VARCHAR(50) | DEFAULT 'picking' | 'allocated', 'picking', 'packing', 'quality_checked', 'ready_to_ship', 'shipped' |
| 5 | Picker_name | VARCHAR(100) |  | Warehouse staff assigned to pick goods |
| 6 | Picked_at | DATETIME |  | Pick completion timestamp |
| 7 | Packed_at | DATETIME |  | Packaging completion timestamp |
| 8 | Dispatched_at | DATETIME |  | Handover to courier timestamp |
| 9 | Packaging_notes | TEXT |  | Box dimensions, special handling labels, weight |

<br>

### **[Table 30: Supplier_evaluations]**
> *Role: Purchase Manager (Evaluating Supplier Performance & Onboarding).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique evaluation scorecard ID |
| 2 | Supplier_id | INTEGER | FOREIGN KEY (Suppliers.Id) | Evaluated supplier |
| 3 | Manufacturer_id | INTEGER | FOREIGN KEY (Manufacturers.Id) | Evaluated manufacturer |
| 4 | Evaluator_id | INTEGER | FOREIGN KEY (Users.Id), NOT NULL | Purchase manager conducting audit |
| 5 | Evaluation_period | VARCHAR(50) | NOT NULL | E.g. 'Q1-2026', 'Annual-2025' |
| 6 | Quality_score | FLOAT | NOT NULL | Inspection pass rate & defect score (0 - 100) |
| 7 | On_time_delivery_rate | FLOAT | NOT NULL | Punctuality percentage (0 - 100%) |
| 8 | Pricing_competitiveness | FLOAT | NOT NULL | Pricing stability vs benchmark score (0 - 100) |
| 9 | Compliance_score | FLOAT | NOT NULL | Regulatory & contract compliance score (0 - 100) |
| 10 | Overall_rating | FLOAT | NOT NULL | Weighted composite supplier rating |
| 11 | Review_comments | TEXT |  | Performance summary and corrective action plans |
| 12 | Evaluated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Audit completion timestamp |

<br>

### **[Table 31: Margin_optimizations]**
> *Role: Purchase Manager (Financial & Margin Optimization).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique margin optimization audit ID |
| 2 | Product_id | INTEGER | FOREIGN KEY (Products.Id), NOT NULL | Analyzed product |
| 3 | Supplier_cost | FLOAT | NOT NULL | Current procurement cost from manufacturer/supplier |
| 4 | Current_selling_price | FLOAT | NOT NULL | Active retail price on store |
| 5 | Gross_margin_amount | FLOAT | NOT NULL | Selling price - Supplier cost |
| 6 | Gross_margin_percentage | FLOAT | NOT NULL | (Margin / Selling Price) * 100 |
| 7 | Target_margin_percentage | FLOAT | NOT NULL | Management benchmark target margin |
| 8 | Recommended_price | FLOAT | NOT NULL | AI/Algorithmic optimal price to achieve target margin |
| 9 | Potential_profit_impact | FLOAT |  | Projected profit delta on sales volume |
| 10 | Strategy_type | VARCHAR(50) |  | 'cost_renegotiation', 'price_elasticity_increase', 'bundle_promotion' |
| 11 | Last_calculated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Calculation timestamp |

<br>

### **[Table 32: Supply_chain_tracking]**
> *Role: Purchase Manager (Supply Chain Tracking).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique tracking milestone ID |
| 2 | Purchase_order_id | INTEGER | FOREIGN KEY (Purchase_orders.Id) | Inbound PO shipment |
| 3 | Carrier_name | VARCHAR(100) | NOT NULL | Logistics provider (FedEx, Maersk, BlueDart, DHL) |
| 4 | Tracking_number | VARCHAR(100) | NOT NULL | Carrier consignment tracking code |
| 5 | Origin_location | VARCHAR(150) | NOT NULL | Factory / port of departure |
| 6 | Destination_location | VARCHAR(150) | NOT NULL | Retail warehouse destination |
| 7 | Current_milestone | VARCHAR(100) | NOT NULL | E.g. 'Customs Cleared', 'Port Departure', 'In Hub' |
| 8 | Transit_status | VARCHAR(50) | DEFAULT 'dispatched' | 'dispatched', 'in_transit', 'customs_hold', 'out_for_delivery', 'delivered' |
| 9 | Estimated_delivery | DATETIME |  | Expected arrival date |
| 10 | Actual_delivery | DATETIME |  | Final arrival timestamp |
| 11 | Delay_flag | BOOLEAN | DEFAULT FALSE | Flag indicating if shipment is delayed |
| 12 | Delay_reason | VARCHAR(255) |  | Reason: port congestion, weather, customs paperwork |
| 13 | Updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Status update timestamp |

<br>

### **[Table 33: Quality_inspections]**
> *Role: Quality Assurance (Check the Quality of the Product).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique quality inspection check identifier |
| 2 | Purchase_order_item_id | INTEGER | FOREIGN KEY (Purchase_order_items.Id) | Inspected procurement shipment batch |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id), NOT NULL | Product being tested |
| 4 | Batch_lot_number | VARCHAR(100) | NOT NULL | Manufacturer lot or production batch ID |
| 5 | Sample_size | INTEGER | NOT NULL | Number of sample units inspected |
| 6 | Defect_count | INTEGER | DEFAULT 0 | Number of units failing QA parameters |
| 7 | Defect_types | JSON |  | Categorization: e.g. {"packaging": 1, "functional": 2} |
| 8 | Inspection_status | VARCHAR(50) | NOT NULL | 'pass', 'fail', 'conditional_acceptance' |
| 9 | Inspector_id | INTEGER | FOREIGN KEY (Users.Id), NOT NULL | QA Specialist performing the inspection |
| 10 | Standards_checked | VARCHAR(255) |  | QA standard checklist (ISO, BIS, CE, Internal) |
| 11 | Remarks | TEXT |  | Inspector findings and notes |
| 12 | Inspected_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Inspection timestamp |

<br>

### **[Table 34: Return_quality_inspections]**
> *Role: Quality Assurance (Manage Returns).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique return inspection record identifier |
| 2 | Return_id | INTEGER | FOREIGN KEY (Returns.Id), NOT NULL | Linked customer return record |
| 3 | Product_id | INTEGER | FOREIGN KEY (Products.Id), NOT NULL | Returned product |
| 4 | Inspector_id | INTEGER | FOREIGN KEY (Users.Id), NOT NULL | QA Specialist performing the return audit |
| 5 | Condition_grade | VARCHAR(50) | NOT NULL | 'sealed_new', 'opened_mint', 'minor_wear', 'damaged', 'defective', 'counterfeit' |
| 6 | Disposition | VARCHAR(50) | NOT NULL | Action: 'restock_grade_a', 'refurbish_outlet', 'vendor_warranty_return', 'salvage_scrap' |
| 7 | Claim_against_manufacturer | BOOLEAN | DEFAULT FALSE | Flag to charge back defective product to manufacturer |
| 8 | Refund_approval_status | VARCHAR(50) | DEFAULT 'approved' | 'approved', 'rejected', 'partial_deduction' |
| 9 | Inspection_notes | TEXT |  | Explanation of condition and refund decision |
| 10 | Inspected_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Return inspection timestamp |

<br>

### **[Table 35: Ml_models]**
> *Role: System Actors (Custom ML Analytics Model - Automates predictions & learns from daily new data).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique model identifier |
| 2 | Model_name | VARCHAR(100) | NOT NULL | Model registry name (e.g. 'demand_forecaster', 'churn_detector') |
| 3 | Version | VARCHAR(50) | NOT NULL | Semantic version string (e.g. 'v1.4.0') |
| 4 | Framework_type | VARCHAR(50) | NOT NULL | 'scikit-learn', 'xgboost', 'prophet', 'gemini-3.6' |
| 5 | Status | VARCHAR(50) | DEFAULT 'active' | 'active', 'training', 'candidate', 'deprecated' |
| 6 | Training_cadence | VARCHAR(50) | DEFAULT 'daily' | Frequency: 'daily', 'hourly', 'event_triggered' |
| 7 | Last_trained_at | DATETIME |  | Timestamp of most recent model training completion |
| 8 | Training_records_count | INTEGER |  | Total historical dataset rows used in training |
| 9 | Primary_metric_name | VARCHAR(50) |  | Metric evaluated: 'RMSE', 'MAE', 'ROC_AUC', 'F1' |
| 10 | Primary_metric_value | FLOAT |  | Performance evaluation score |
| 11 | Artifact_path | VARCHAR(255) |  | File path or URI to serialized model weights/pipeline |
| 12 | Created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registry entry timestamp |

<br>

### **[Table 36: Ml_training_logs]**
> *Role: System Actors (Daily automated model training and continuous learning history).*

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Unique training run audit identifier |
| 2 | Model_id | INTEGER | FOREIGN KEY (Ml_models.Id), NOT NULL | Associated registered ML model |
| 3 | Training_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date automated retraining was triggered |
| 4 | New_data_points_learned | INTEGER | NOT NULL | Number of new daily rows ingested (sales, returns, inventory deltas) |
| 5 | Data_source_snapshot | VARCHAR(200) |  | Description or hash of daily delta snapshot |
| 6 | Evaluation_loss | FLOAT |  | Loss metric recorded after training on new data |
| 7 | Metric_improvement | FLOAT |  | Delta in accuracy vs previous model checkpoint |
| 8 | Drift_detected | BOOLEAN | DEFAULT FALSE | Flag indicating feature or concept drift detected in daily data |
| 9 | Retrained_automatically | BOOLEAN | DEFAULT TRUE | Indicates autonomous daily cron / event trigger |
| 10 | Duration_seconds | FLOAT |  | Execution time of training pipeline in seconds |
| 11 | Status | VARCHAR(50) | DEFAULT 'success' | 'success', 'failed', 'evaluating' |
| 12 | Log_details | TEXT |  | Detailed traceback, logs, and hyperparameters |

---
