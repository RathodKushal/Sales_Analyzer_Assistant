# Indian E-Commerce Sales & Customer Dataset

This dataset was synthetically transformed from the UCI Online Retail II dataset into a robust, relational Indian e-commerce context. It consists of 6 CSV files representing different entities in a modern CRM platform.

## Files

### 1. `customers.csv`
Contains customer profiles, demographics, and contact information.
- **CustomerID:** Unique identifier
- **Name:** Indian customer name
- **Email, Phone:** Contact details
- **Gender, Age:** Demographics
- **State, City, Pincode:** Indian geography

### 2. `orders.csv`
Contains order-level summary information.
- **OrderID:** Unique invoice number
- **CustomerID:** Foreign key to customers
- **OrderDate:** Timestamp of order
- **State, City:** Shipping destination
- **TotalAmount:** Total order value in INR (₹)
- **TotalItems:** Number of items in order
- **Status:** Completed or Returned
- **Discount:** Applied discount percentage (0-30%)
- **Profit:** Estimated profit margin

### 3. `order_items.csv`
Contains line-item details for each order.
- **OrderID:** Foreign key to orders
- **StockCode:** Product ID
- **Description:** Product name
- **Quantity:** Units purchased
- **UnitPrice:** Price per unit in INR (₹)
- **TotalAmount:** Line total in INR (₹)
- **IsReturned:** Boolean flag

### 4. `products.csv`
Contains product catalog and analytics.
- **StockCode:** Unique product identifier
- **Description:** Product name
- **Category:** Assigned product category (e.g., Home Decor, Kitchen & Dining)
- **AvgPrice:** Average selling price in INR
- **TotalQuantitySold:** Total units moved
- **TotalRevenue:** Total revenue generated

### 5. `payments.csv`
Contains payment transaction details.
- **OrderID:** Foreign key to orders
- **PaymentMethod:** UPI, COD, Credit Card, Debit Card, Net Banking
- **Amount:** Payment amount
- **Status:** Completed or Refunded

### 6. `returns.csv`
Contains details of returned orders.
- **OrderID:** Foreign key to orders
- **CustomerID:** Foreign key to customers
- **ReturnReason:** Reason for return (e.g., Damaged, Wrong item)
- **RefundAmount:** Amount refunded in INR
- **ReturnStatus:** Current status of the return
- **ReturnDate:** Timestamp of return

## Usage

This dataset is used to train the E-Commerce Pricing Optimization RL Agent (`model/train.py`), which learns to optimize discounts based on customer segmentation (RFM), lifetime value, and return risk. It is also loaded into the MySQL database to populate the ShopFlow CRM application.
