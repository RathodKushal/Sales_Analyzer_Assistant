# Database Schema

**[Table 1: Users]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the user |
| 2 | Username | VARCHAR(50) | NOT NULL | Users's username |
| 3 | Email | VARCHAR(100) | NOT NULL | Users's email |
| 4 | Hashed_password | VARCHAR(255) | NOT NULL | Users's hashed password |
| 5 | Role | VARCHAR(20) | NOT NULL | Users's role |
| 6 | Created_at | DATETIME |  | Users's created at |

<br>

**[Table 2: Customers]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the customer |
| 2 | Customer_id | INTEGER |  | Customers's customer id |
| 3 | Name | VARCHAR(100) |  | Customers's name |
| 4 | Email | VARCHAR(100) |  | Customers's email |
| 5 | Phone | VARCHAR(20) |  | Customers's phone |
| 6 | Gender | VARCHAR(20) |  | Customers's gender |
| 7 | Age | INTEGER |  | Customers's age |
| 8 | State | VARCHAR(100) |  | Customers's state |
| 9 | City | VARCHAR(100) |  | Customers's city |
| 10 | Pincode | VARCHAR(20) |  | Customers's pincode |
| 11 | Segment | VARCHAR(50) |  | Customers's segment |
| 12 | Total_orders | INTEGER |  | Customers's total orders |
| 13 | Total_spent | FLOAT |  | Customers's total spent |
| 14 | Avg_order_value | FLOAT |  | Customers's avg order value |
| 15 | Return_rate | FLOAT |  | Customers's return rate |
| 16 | First_purchase_date | DATETIME |  | Customers's first purchase date |
| 17 | Last_purchase_date | DATETIME |  | Customers's last purchase date |
| 18 | Lifetime_value | FLOAT |  | Customers's lifetime value |
| 19 | Churn_risk_score | FLOAT |  | Customers's churn risk score |
| 20 | Created_at | DATETIME |  | Customers's created at |
| 21 | Updated_at | DATETIME |  | Customers's updated at |

<br>

**[Table 3: Products]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the product |
| 2 | Stock_code | VARCHAR(50) |  | Products's stock code |
| 3 | Description | VARCHAR(200) |  | Products's description |
| 4 | Category | VARCHAR(100) |  | Products's category |
| 5 | Avg_price | FLOAT |  | Products's avg price |
| 6 | Total_quantity_sold | INTEGER |  | Products's total quantity sold |
| 7 | Total_revenue | FLOAT |  | Products's total revenue |
| 8 | Return_rate | FLOAT |  | Products's return rate |
| 9 | Popularity_rank | INTEGER |  | Products's popularity rank |

<br>

**[Table 4: Orders]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the order |
| 2 | Order_id | VARCHAR(50) |  | Orders's order id |
| 3 | Customer_id | INTEGER |  | Orders's customer id |
| 4 | Order_date | DATETIME |  | Orders's order date |
| 5 | State | VARCHAR(100) |  | Orders's state |
| 6 | City | VARCHAR(100) |  | Orders's city |
| 7 | Total_amount | FLOAT |  | Orders's total amount |
| 8 | Total_items | INTEGER |  | Orders's total items |
| 9 | Status | VARCHAR(50) |  | Orders's status |
| 10 | Discount_applied | FLOAT |  | Orders's discount applied |
| 11 | Payment_method | VARCHAR(50) |  | Orders's payment method |
| 12 | Profit_estimate | FLOAT |  | Orders's profit estimate |

<br>

**[Table 5: Document_analysis]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the document_analysi |
| 2 | User_id | INTEGER |  | Document_analysis's user id |
| 3 | Filename | VARCHAR(255) |  | Document_analysis's filename |
| 4 | File_type | VARCHAR(50) |  | Document_analysis's file type |
| 5 | Raw_text | TEXT |  | Document_analysis's raw text |
| 6 | Structured_insights | JSON |  | Document_analysis's structured insights |
| 7 | Created_at | DATETIME |  | Document_analysis's created at |

<br>

**[Table 6: Order_items]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the order_item |
| 2 | Order_id | VARCHAR(50) |  | Order_items's order id |
| 3 | Stock_code | VARCHAR(50) |  | Order_items's stock code |
| 4 | Description | VARCHAR(200) |  | Order_items's description |
| 5 | Quantity | INTEGER |  | Order_items's quantity |
| 6 | Unit_price | FLOAT |  | Order_items's unit price |
| 7 | Line_total | FLOAT |  | Order_items's line total |
| 8 | Is_returned | BOOLEAN |  | Order_items's is returned |

<br>

**[Table 7: Returns]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the return |
| 2 | Order_id | VARCHAR(50) |  | Returns's order id |
| 3 | Customer_id | INTEGER |  | Returns's customer id |
| 4 | Return_reason | VARCHAR(200) |  | Returns's return reason |
| 5 | Refund_amount | FLOAT |  | Returns's refund amount |
| 6 | Return_status | VARCHAR(50) |  | Returns's return status |
| 7 | Return_date | DATETIME |  | Returns's return date |

<br>

**[Table 8: Addresses]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the addresse |
| 2 | Customer_id | INTEGER |  | Addresses's customer id |
| 3 | Address_line_1 | VARCHAR(255) |  | Addresses's address line 1 |
| 4 | Address_line_2 | VARCHAR(255) |  | Addresses's address line 2 |
| 5 | City | VARCHAR(100) |  | Addresses's city |
| 6 | State | VARCHAR(100) |  | Addresses's state |
| 7 | Pincode | VARCHAR(20) |  | Addresses's pincode |
| 8 | Is_default | BOOLEAN |  | Addresses's is default |

<br>

**[Table 9: Wishlists]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the wishlist |
| 2 | Customer_id | INTEGER |  | Wishlists's customer id |
| 3 | Product_id | INTEGER |  | Wishlists's product id |
| 4 | Added_date | DATETIME |  | Wishlists's added date |

<br>

**[Table 10: Reviews]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the review |
| 2 | Customer_id | INTEGER |  | Reviews's customer id |
| 3 | Product_id | INTEGER |  | Reviews's product id |
| 4 | Rating | INTEGER |  | Reviews's rating |
| 5 | Review_text | TEXT |  | Reviews's review text |
| 6 | Sentiment_score | FLOAT |  | Reviews's sentiment score |
| 7 | Created_at | DATETIME |  | Reviews's created at |

<br>

**[Table 11: Cart_items]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the cart_item |
| 2 | Customer_id | INTEGER |  | Cart_items's customer id |
| 3 | Product_id | INTEGER |  | Cart_items's product id |
| 4 | Quantity | INTEGER |  | Cart_items's quantity |
| 5 | Added_date | DATETIME |  | Cart_items's added date |

<br>

**[Table 12: Categories]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the categorie |
| 2 | Name | VARCHAR(100) |  | Categories's name |
| 3 | Description | VARCHAR(200) |  | Categories's description |
| 4 | Parent_category_id | INTEGER |  | Categories's parent category id |

<br>

**[Table 13: Brands]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the brand |
| 2 | Name | VARCHAR(100) |  | Brands's name |
| 3 | Manufacturer | VARCHAR(100) |  | Brands's manufacturer |
| 4 | Country_of_origin | VARCHAR(50) |  | Brands's country of origin |

<br>

**[Table 14: Inventory]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the inventory |
| 2 | Product_id | INTEGER |  | Inventory's product id |
| 3 | Warehouse_location | VARCHAR(100) |  | Inventory's warehouse location |
| 4 | Stock_level | INTEGER |  | Inventory's stock level |
| 5 | Reorder_threshold | INTEGER |  | Inventory's reorder threshold |
| 6 | Last_restock_date | DATETIME |  | Inventory's last restock date |

<br>

**[Table 15: Suppliers]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the supplier |
| 2 | Name | VARCHAR(150) |  | Suppliers's name |
| 3 | Contact_email | VARCHAR(100) |  | Suppliers's contact email |
| 4 | Contact_phone | VARCHAR(20) |  | Suppliers's contact phone |
| 5 | Rating | FLOAT |  | Suppliers's rating |

<br>

**[Table 16: Payments]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the payment |
| 2 | Order_id | VARCHAR(50) |  | Payments's order id |
| 3 | Payment_method | VARCHAR(50) |  | Payments's payment method |
| 4 | Amount | FLOAT |  | Payments's amount |
| 5 | Transaction_id | VARCHAR(100) |  | Payments's transaction id |
| 6 | Payment_date | DATETIME |  | Payments's payment date |
| 7 | Status | VARCHAR(50) |  | Payments's status |

<br>

**[Table 17: Shipping_methods]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the shipping_method |
| 2 | Name | VARCHAR(100) |  | Shipping_methods's name |
| 3 | Cost | FLOAT |  | Shipping_methods's cost |
| 4 | Estimated_days | INTEGER |  | Shipping_methods's estimated days |

<br>

**[Table 18: Promotions]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the promotion |
| 2 | Code | VARCHAR(50) |  | Promotions's code |
| 3 | Description | VARCHAR(200) |  | Promotions's description |
| 4 | Discount_percentage | FLOAT |  | Promotions's discount percentage |
| 5 | Start_date | DATETIME |  | Promotions's start date |
| 6 | End_date | DATETIME |  | Promotions's end date |
| 7 | Is_active | BOOLEAN |  | Promotions's is active |
| 8 | Ai_recommended | BOOLEAN |  | Promotions's ai recommended |

<br>

**[Table 19: Ml_predictions]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the ml_prediction |
| 2 | Model_name | VARCHAR(100) |  | Ml_predictions's model name |
| 3 | Target_entity_id | VARCHAR(100) |  | Ml_predictions's target entity id |
| 4 | Prediction_type | VARCHAR(50) |  | Ml_predictions's prediction type |
| 5 | Prediction_value | FLOAT |  | Ml_predictions's prediction value |
| 6 | Confidence_score | FLOAT |  | Ml_predictions's confidence score |
| 7 | Features_used | JSON |  | Ml_predictions's features used |
| 8 | Created_at | DATETIME |  | Ml_predictions's created at |

<br>

**[Table 20: Shipments]**

| SR.NO | FIELD NAME | DATATYPE(SIZE) | CONSTRAINT | DESCRIPTION |
|---|---|---|---|---|
| 1 | Id | INTEGER | PRIMARY KEY, NOT NULL | Unique identifier for the shipment |
| 2 | Order_id | VARCHAR(50) |  | Shipments's order id |
| 3 | Shipping_method_id | INTEGER |  | Shipments's shipping method id |
| 4 | Tracking_number | VARCHAR(100) |  | Shipments's tracking number |
| 5 | Status | VARCHAR(50) |  | Shipments's status |
| 6 | Shipped_date | DATETIME |  | Shipments's shipped date |
| 7 | Estimated_delivery | DATETIME |  | Shipments's estimated delivery |

<br>

