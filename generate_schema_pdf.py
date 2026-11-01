import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (on pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, letter[1] - 30, "Unified Database Schema & Relationship Specification")
            self.drawRightString(letter[0] - 36, letter[1] - 30, "Sales Analyzer + AI-MINI-PROJECT")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(36, letter[1] - 34, letter[0] - 36, letter[1] - 34)

        # Footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(36, 40, letter[0] - 36, 40)
        self.drawString(36, 28, "Confidential - Unified Database Architecture Specification")
        self.drawRightString(letter[0] - 36, 28, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf(filename="Unified_Database_Schema_and_Relationships.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=48
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0f172a'),
        alignment=0,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2563eb'),
        spaceBefore=12,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    th_style = ParagraphStyle(
        'TH_Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        'TD_Style',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1e293b')
    )
    
    td_bold = ParagraphStyle(
        'TD_Bold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # Title Banner
    story.append(Paragraph("Unified Database Schema & Relationships", title_style))
    story.append(Paragraph(
        "Complete Architecture Specification: <b>Sales Analyzer Assistant</b> + <b>AI-MINI-PROJECT</b> + <b>Role Actors</b><br/>"
        "<i>Includes: Manufacturer (VMI & Catalog), Inventory Manager, Purchase Manager, QA, and Continuous ML System Actors</i>",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=14))

    # Executive Summary Card
    summary_data = [
        [
            Paragraph("<b>Total Tables:</b> 36", body_style),
            Paragraph("<b>Modified Existing:</b> 8 Tables", body_style),
            Paragraph("<b>Added AI-MINI:</b> 4 Tables", body_style),
            Paragraph("<b>Added Roles:</b> 12 Tables", body_style)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[135, 135, 135, 135])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # SECTION 1: Master Table Specifications
    story.append(Paragraph("1. Master Table Specifications (All 36 Tables)", h1_style))
    story.append(Paragraph(
        "Each table below contains its complete attributes, data types, constraints, and operational descriptions.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Data for all 36 tables
    tables_dict = [
        # Multi-Tenant & Users
        ("Table 1: Users", "Users & Authentication (Modified with Company_id and Extended Roles)", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Unique user identifier"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Multi-tenant tenant reference"),
            ("3", "Username", "VARCHAR(50)", "NOT NULL, UNIQUE", "Login username"),
            ("4", "Email", "VARCHAR(100)", "NOT NULL, UNIQUE", "User email address"),
            ("5", "Hashed_password", "VARCHAR(255)", "NOT NULL", "Password hash"),
            ("6", "Role", "VARCHAR(50)", "NOT NULL", "'admin', 'staff', 'manufacturer', 'inventory_manager', 'purchase_manager', 'qa_inspector', 'customer'"),
            ("7", "Phone", "VARCHAR(20)", "", "Contact telephone number"),
            ("8", "Is_active", "BOOLEAN", "DEFAULT TRUE", "Account status flag"),
            ("9", "Created_at", "DATETIME", "DEFAULT NOW()", "Registration timestamp")
        ]),
        ("Table 2: Companies", "AI-MINI-PROJECT Multi-Tenant Enterprise Entity", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Unique enterprise identifier"),
            ("2", "Name", "VARCHAR(255)", "NOT NULL", "Registered enterprise company name"),
            ("3", "Low_stock_threshold", "INTEGER", "DEFAULT 10", "Company-wide low stock alert threshold"),
            ("4", "Created_at", "DATETIME", "DEFAULT NOW()", "Tenant onboarding timestamp")
        ]),
        ("Table 3: Customers", "Customer 360 & Churn Profiling", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Internal customer ID"),
            ("2", "Customer_id", "INTEGER", "", "External/legacy customer code"),
            ("3", "Name", "VARCHAR(100)", "", "Customer full name"),
            ("4", "Email", "VARCHAR(100)", "", "Customer email address"),
            ("5", "Phone", "VARCHAR(20)", "", "Contact phone number"),
            ("6", "Gender", "VARCHAR(20)", "", "Gender"),
            ("7", "Age", "INTEGER", "", "Age in years"),
            ("8", "State", "VARCHAR(100)", "", "State/Province"),
            ("9", "City", "VARCHAR(100)", "", "City"),
            ("10", "Pincode", "VARCHAR(20)", "", "Postal code"),
            ("11", "Segment", "VARCHAR(50)", "", "High-Value, Churn-Risk, Regular"),
            ("12", "Total_orders", "INTEGER", "DEFAULT 0", "Cumulative orders placed"),
            ("13", "Total_spent", "FLOAT", "DEFAULT 0.0", "Lifetime monetary value"),
            ("14", "Avg_order_value", "FLOAT", "DEFAULT 0.0", "Average spend per order"),
            ("15", "Return_rate", "FLOAT", "DEFAULT 0.0", "Historical return percentage"),
            ("16", "Lifetime_value", "FLOAT", "", "Predicted Customer Lifetime Value (CLV)"),
            ("17", "Churn_risk_score", "FLOAT", "", "ML predicted churn risk (0.0 - 1.0)"),
            ("18", "Created_at", "DATETIME", "DEFAULT NOW()", "Customer record creation timestamp")
        ]),
        ("Table 4: Products", "Product Master Catalog (Modified with Sku, Manufacturer_id, Costs)", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Unique product identifier"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant organization reference"),
            ("3", "Sku", "VARCHAR(100)", "UNIQUE", "Stock Keeping Unit"),
            ("4", "Stock_code", "VARCHAR(50)", "", "Legacy stock identifier"),
            ("5", "Manufacturer_id", "INTEGER", "FK (Manufacturers.Id)", "Associated OEM manufacturer"),
            ("6", "Description", "VARCHAR(255)", "", "Product name and specifications"),
            ("7", "Category", "VARCHAR(100)", "", "Primary merchandising category"),
            ("8", "Cost_price", "FLOAT", "DEFAULT 0.0", "Procurement / production cost per unit"),
            ("9", "Selling_price", "FLOAT", "DEFAULT 0.0", "Catalog retail selling price"),
            ("10", "Min_order_quantity", "INTEGER", "DEFAULT 1", "Minimum order quantity (MOQ)"),
            ("11", "Total_quantity_sold", "INTEGER", "DEFAULT 0", "Historical units sold"),
            ("12", "Total_revenue", "FLOAT", "DEFAULT 0.0", "Historical sales revenue"),
            ("13", "Return_rate", "FLOAT", "DEFAULT 0.0", "Product return rate"),
            ("14", "Popularity_rank", "INTEGER", "", "Sales volume popularity ranking")
        ]),
        ("Table 5: Categories", "Merchandising Category Hierarchy", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Category identifier"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant organization reference"),
            ("3", "Name", "VARCHAR(100)", "NOT NULL", "Category name"),
            ("4", "Description", "VARCHAR(200)", "", "Category description"),
            ("5", "Parent_category_id", "INTEGER", "FK (Categories.Id)", "Self-referencing parent category")
        ]),
        ("Table 6: Brands", "Brand Portfolio", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Brand identifier"),
            ("2", "Name", "VARCHAR(100)", "NOT NULL", "Brand trade name"),
            ("3", "Manufacturer", "VARCHAR(100)", "", "Manufacturer corporate name"),
            ("4", "Country_of_origin", "VARCHAR(50)", "", "Country of manufacturing")
        ]),
        ("Table 7: Orders", "Sales Orders (Modified with Fulfillment_status & Manager)", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Internal sequence ID"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant reference"),
            ("3", "Order_id", "VARCHAR(50)", "NOT NULL, UNIQUE", "Business order number"),
            ("4", "Customer_id", "INTEGER", "FK (Customers.Id)", "Purchasing customer"),
            ("5", "Order_date", "DATETIME", "DEFAULT NOW()", "Order placed timestamp"),
            ("6", "Total_amount", "FLOAT", "NOT NULL", "Final invoice amount"),
            ("7", "Total_items", "INTEGER", "NOT NULL", "Units ordered count"),
            ("8", "Status", "VARCHAR(50)", "DEFAULT 'pending'", "'pending', 'paid', 'cancelled', 'refunded'"),
            ("9", "Fulfillment_status", "VARCHAR(50)", "DEFAULT 'unfulfilled'", "'unfulfilled', 'picking', 'packed', 'dispatched'"),
            ("10", "Assigned_inventory_manager_id", "INTEGER", "FK (Users.Id)", "Inventory Manager supervising order"),
            ("11", "Discount_applied", "FLOAT", "DEFAULT 0.0", "Discount deduction"),
            ("12", "Payment_method", "VARCHAR(50)", "", "Mode of payment"),
            ("13", "Profit_estimate", "FLOAT", "", "Estimated net profit")
        ]),
        ("Table 8: Order_items", "Order Line Items", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Line item identifier"),
            ("2", "Order_id", "VARCHAR(50)", "FK (Orders.Order_id)", "Associated parent order"),
            ("3", "Stock_code", "VARCHAR(50)", "", "Item SKU / stock code"),
            ("4", "Description", "VARCHAR(200)", "", "Product title"),
            ("5", "Quantity", "INTEGER", "NOT NULL", "Units purchased"),
            ("6", "Unit_price", "FLOAT", "NOT NULL", "Price per unit"),
            ("7", "Line_total", "FLOAT", "NOT NULL", "Net line total"),
            ("8", "Is_returned", "BOOLEAN", "DEFAULT FALSE", "Flag if item was returned")
        ]),
        ("Table 9: Sales_fulfillments", "Inventory Manager: Sales Order Fulfillment Operations", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Fulfillment execution ID"),
            ("2", "Order_id", "VARCHAR(50)", "FK (Orders.Order_id)", "Sales order being fulfilled"),
            ("3", "Inventory_manager_id", "INTEGER", "FK (Users.Id)", "Inventory manager supervising line"),
            ("4", "Fulfillment_stage", "VARCHAR(50)", "DEFAULT 'allocated'", "'allocated', 'picking', 'packing', 'dispatched'"),
            ("5", "Picker_name", "VARCHAR(100)", "", "Assigned warehouse picker"),
            ("6", "Picked_at", "DATETIME", "", "Pick completion timestamp"),
            ("7", "Packed_at", "DATETIME", "", "Package sealing timestamp"),
            ("8", "Dispatched_at", "DATETIME", "", "Courier handoff timestamp"),
            ("9", "Packaging_notes", "TEXT", "", "Box dimensions, weights, labels")
        ]),
        ("Table 10: Inventory", "Stock Tracking & Warehousing (Modified with Available/Reserved)", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Inventory record ID"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant reference"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Tracked product"),
            ("4", "Warehouse_location", "VARCHAR(100)", "NOT NULL", "Facility location / warehouse"),
            ("5", "Bin_location", "VARCHAR(50)", "", "Aisle / rack / shelf position"),
            ("6", "Stock_level", "INTEGER", "NOT NULL, DEFAULT 0", "Total physical on-hand stock"),
            ("7", "Reserved_stock", "INTEGER", "DEFAULT 0", "Stock committed to pending orders"),
            ("8", "Available_stock", "INTEGER", "DEFAULT 0", "Uncommitted stock (Stock_level - Reserved)"),
            ("9", "Reorder_threshold", "INTEGER", "DEFAULT 10", "Stock floor triggering replenishment"),
            ("10", "Last_restock_date", "DATETIME", "", "Most recent restock delivery")
        ]),
        ("Table 11: Inventory_adjustments", "Inventory Manager: Day-to-Day Stock Control & Audits", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Adjustment audit ID"),
            ("2", "Inventory_id", "INTEGER", "FK (Inventory.Id)", "Adjusted inventory record"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Affected product"),
            ("4", "Adjustment_type", "VARCHAR(50)", "NOT NULL", "'cycle_count', 'damage_writeoff', 'shrinkage', 'restock'"),
            ("5", "Quantity_change", "INTEGER", "NOT NULL", "Net delta (+/- units)"),
            ("6", "Quantity_before", "INTEGER", "NOT NULL", "Stock level before count"),
            ("7", "Quantity_after", "INTEGER", "NOT NULL", "Stock level after count"),
            ("8", "Reason", "VARCHAR(255)", "", "Audit justification notes"),
            ("9", "Performed_by", "INTEGER", "FK (Users.Id)", "Inventory manager conducting audit"),
            ("10", "Created_at", "DATETIME", "DEFAULT NOW()", "Adjustment timestamp")
        ]),
        ("Table 12: Manufacturers", "Manufacturer: Enterprise Profiles & VMI Capability", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Manufacturer identifier"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant organization reference"),
            ("3", "Name", "VARCHAR(200)", "NOT NULL", "Manufacturer corporate name"),
            ("4", "Manufacturer_code", "VARCHAR(50)", "NOT NULL, UNIQUE", "Standardized manufacturer code"),
            ("5", "Contact_person", "VARCHAR(100)", "", "Primary executive liaison"),
            ("6", "Email", "VARCHAR(100)", "NOT NULL", "Official corporate email"),
            ("7", "Phone", "VARCHAR(50)", "", "Contact telephone number"),
            ("8", "Address", "TEXT", "", "Factory / headquarter address"),
            ("9", "Country", "VARCHAR(100)", "", "Country of manufacturing origin"),
            ("10", "Compliance_status", "VARCHAR(50)", "DEFAULT 'under_review'", "'certified', 'under_review', 'non_compliant'"),
            ("11", "Onboarding_status", "VARCHAR(50)", "DEFAULT 'pending'", "'pending', 'approved', 'active', 'rejected'"),
            ("12", "Vmi_enabled", "BOOLEAN", "DEFAULT FALSE", "Enables Vendor-Managed Inventory"),
            ("13", "Lead_time_days", "INTEGER", "DEFAULT 14", "Standard production turnaround"),
            ("14", "Created_at", "DATETIME", "DEFAULT NOW()", "Onboarding timestamp")
        ]),
        ("Table 13: Manufacturer_catalogs", "Manufacturer: Product and Catalog Management", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Catalog item ID"),
            ("2", "Manufacturer_id", "INTEGER", "FK (Manufacturers.Id)", "Publishing manufacturer"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Linked internal product (if onboarded)"),
            ("4", "Manufacturer_sku", "VARCHAR(100)", "NOT NULL", "Manufacturer OEM SKU"),
            ("5", "Catalog_item_name", "VARCHAR(200)", "NOT NULL", "Official vendor item name"),
            ("6", "Specifications", "JSON", "", "Technical specs & dimensions"),
            ("7", "Unit_cost", "FLOAT", "NOT NULL", "Wholesale supply cost"),
            ("8", "Moq", "INTEGER", "DEFAULT 1", "Minimum Order Quantity"),
            ("9", "Production_lead_time_days", "INTEGER", "DEFAULT 7", "Production turnaround in days"),
            ("10", "Is_active", "BOOLEAN", "DEFAULT TRUE", "Live in active catalog")
        ]),
        ("Table 14: Vmi_replenishments", "Manufacturer: Proactive Inventory Replenishment (VMI)", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Replenishment request ID"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant organization reference"),
            ("3", "Manufacturer_id", "INTEGER", "FK (Manufacturers.Id)", "Proposing manufacturer"),
            ("4", "Product_id", "INTEGER", "FK (Products.Id)", "Target restock product"),
            ("5", "Current_stock_snapshot", "INTEGER", "NOT NULL", "Stock level at time of calculation"),
            ("6", "Suggested_replenishment_qty", "INTEGER", "NOT NULL", "Manufacturer calculated restock qty"),
            ("7", "Approved_replenishment_qty", "INTEGER", "", "Authorized quantity by retailer"),
            ("8", "Trigger_rule", "VARCHAR(50)", "DEFAULT 'min_threshold'", "'min_threshold', 'ai_demand_forecast', 'cycle'"),
            ("9", "Status", "VARCHAR(50)", "DEFAULT 'proposed'", "'proposed', 'approved', 'dispatched', 'received'"),
            ("10", "Dispatch_date", "DATETIME", "", "Expected/actual dispatch date"),
            ("11", "Delivery_eta", "DATETIME", "", "Target warehouse delivery date"),
            ("12", "Created_at", "DATETIME", "DEFAULT NOW()", "Proposal creation timestamp")
        ]),
        ("Table 15: Suppliers", "Purchase Manager: Sourcing & Onboarding Profiles", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Supplier identifier"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant organization reference"),
            ("3", "Name", "VARCHAR(150)", "NOT NULL", "Supplier / distributor enterprise name"),
            ("4", "Supplier_type", "VARCHAR(50)", "DEFAULT 'manufacturer'", "'manufacturer', 'distributor', 'wholesaler'"),
            ("5", "Onboarding_status", "VARCHAR(50)", "DEFAULT 'active'", "'onboarding', 'verified', 'active', 'suspended'"),
            ("6", "Contact_person", "VARCHAR(100)", "", "Account manager liaison"),
            ("7", "Contact_email", "VARCHAR(100)", "NOT NULL", "Supplier email address"),
            ("8", "Contact_phone", "VARCHAR(20)", "", "Supplier phone number"),
            ("9", "Payment_terms", "VARCHAR(100)", "", "Payment terms ('Net 30', 'Advance 50%')"),
            ("10", "Lead_time_days", "INTEGER", "DEFAULT 7", "Turnaround delivery days"),
            ("11", "Rating", "FLOAT", "DEFAULT 5.0", "Supplier star rating (1.0 to 5.0)"),
            ("12", "Evaluation_score", "FLOAT", "", "Composite evaluation score (0 - 100)")
        ]),
        ("Table 16: Supplier_evaluations", "Purchase Manager: Evaluating Supplier Performance", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Scorecard audit ID"),
            ("2", "Supplier_id", "INTEGER", "FK (Suppliers.Id)", "Evaluated supplier"),
            ("3", "Manufacturer_id", "INTEGER", "FK (Manufacturers.Id)", "Evaluated manufacturer"),
            ("4", "Evaluator_id", "INTEGER", "FK (Users.Id)", "Purchase manager conducting audit"),
            ("5", "Evaluation_period", "VARCHAR(50)", "NOT NULL", "E.g. 'Q1-2026', 'Annual-2025'"),
            ("6", "Quality_score", "FLOAT", "NOT NULL", "Inspection pass & defect score (0 - 100)"),
            ("7", "On_time_delivery_rate", "FLOAT", "NOT NULL", "Punctuality percentage (0 - 100%)"),
            ("8", "Pricing_competitiveness", "FLOAT", "NOT NULL", "Price competitiveness score (0 - 100)"),
            ("9", "Compliance_score", "FLOAT", "NOT NULL", "Contract & ISO compliance (0 - 100)"),
            ("10", "Overall_rating", "FLOAT", "NOT NULL", "Weighted overall rating score"),
            ("11", "Review_comments", "TEXT", "", "Auditor remarks and improvement plans"),
            ("12", "Evaluated_at", "DATETIME", "DEFAULT NOW()", "Evaluation completion date")
        ]),
        ("Table 17: Purchase_orders", "Purchase Manager: PO Execution Workflow", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Purchase order ID"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant organization reference"),
            ("3", "Supplier_id", "INTEGER", "FK (Suppliers.Id)", "Contracted supplier / vendor"),
            ("4", "Po_number", "VARCHAR(50)", "NOT NULL, UNIQUE", "Formal PO code (e.g., 'PO-2026-001')"),
            ("5", "Status", "VARCHAR(50)", "DEFAULT 'pending'", "'draft', 'pending', 'issued', 'fulfilled', 'cancelled'"),
            ("6", "Total_amount", "FLOAT", "DEFAULT 0.0", "Total financial cost of procurement"),
            ("7", "Issued_date", "DATETIME", "", "Official issuance timestamp"),
            ("8", "Expected_delivery_date", "DATETIME", "", "Supplier agreed fulfillment date"),
            ("9", "Created_by", "INTEGER", "FK (Users.Id)", "Purchase manager authoring PO"),
            ("10", "Created_at", "DATETIME", "DEFAULT NOW()", "Creation timestamp")
        ]),
        ("Table 18: Purchase_order_items", "Purchase Order Line Items", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "PO item ID"),
            ("2", "Purchase_order_id", "INTEGER", "FK (Purchase_orders.Id)", "Parent purchase order"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Ordered catalog product"),
            ("4", "Quantity", "INTEGER", "NOT NULL", "Procurement unit volume"),
            ("5", "Cost", "FLOAT", "NOT NULL", "Agreed unit procurement price"),
            ("6", "Received_quantity", "INTEGER", "DEFAULT 0", "Units received and verified in warehouse")
        ]),
        ("Table 19: Margin_optimizations", "Purchase Manager: Financial & Margin Optimization", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Margin audit record ID"),
            ("2", "Product_id", "INTEGER", "FK (Products.Id)", "Analyzed catalog product"),
            ("3", "Supplier_cost", "FLOAT", "NOT NULL", "Procurement cost per unit"),
            ("4", "Current_selling_price", "FLOAT", "NOT NULL", "Active retail listing price"),
            ("5", "Gross_margin_amount", "FLOAT", "NOT NULL", "Unit margin (Selling Price - Cost)"),
            ("6", "Gross_margin_percentage", "FLOAT", "NOT NULL", "Gross margin percentage"),
            ("7", "Target_margin_percentage", "FLOAT", "NOT NULL", "Target margin benchmark"),
            ("8", "Recommended_price", "FLOAT", "NOT NULL", "AI optimal price to maximize profit"),
            ("9", "Potential_profit_impact", "FLOAT", "", "Projected total profit impact"),
            ("10", "Strategy_type", "VARCHAR(50)", "", "'cost_renegotiation', 'price_increase'"),
            ("11", "Last_calculated_at", "DATETIME", "DEFAULT NOW()", "Calculation timestamp")
        ]),
        ("Table 20: Supply_chain_tracking", "Purchase Manager: Supply Chain Tracking", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Tracking milestone ID"),
            ("2", "Purchase_order_id", "INTEGER", "FK (Purchase_orders.Id)", "Inbound procurement order"),
            ("3", "Carrier_name", "VARCHAR(100)", "NOT NULL", "Freight provider (DHL, FedEx, BlueDart)"),
            ("4", "Tracking_number", "VARCHAR(100)", "NOT NULL", "Airway bill / container tracking code"),
            ("5", "Origin_location", "VARCHAR(150)", "NOT NULL", "Factory origin or departure port"),
            ("6", "Destination_location", "VARCHAR(150)", "NOT NULL", "Target warehouse destination"),
            ("7", "Current_milestone", "VARCHAR(100)", "NOT NULL", "E.g. 'Customs Cleared', 'In Hub'"),
            ("8", "Transit_status", "VARCHAR(50)", "DEFAULT 'dispatched'", "'dispatched', 'in_transit', 'customs_hold', 'delivered'"),
            ("9", "Estimated_delivery", "DATETIME", "", "Expected arrival date"),
            ("10", "Actual_delivery", "DATETIME", "", "Warehouse delivery timestamp"),
            ("11", "Delay_flag", "BOOLEAN", "DEFAULT FALSE", "Flag indicating transit delay"),
            ("12", "Delay_reason", "VARCHAR(255)", "", "Reason: customs hold, weather, port congestion"),
            ("13", "Updated_at", "DATETIME", "DEFAULT NOW()", "Status update timestamp")
        ]),
        ("Table 21: Quality_inspections", "Quality Assurance: Check the Quality of the Product", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Quality check ID"),
            ("2", "Purchase_order_item_id", "INTEGER", "FK (Purchase_order_items.Id)", "Inspected procurement batch"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Product undergoing testing"),
            ("4", "Batch_lot_number", "VARCHAR(100)", "NOT NULL", "Manufacturer production batch/lot"),
            ("5", "Sample_size", "INTEGER", "NOT NULL", "Number of sampled units"),
            ("6", "Defect_count", "INTEGER", "DEFAULT 0", "Number of defective units found"),
            ("7", "Defect_types", "JSON", "", "Defect breakdown (e.g. {'functional': 1})"),
            ("8", "Inspection_status", "VARCHAR(50)", "NOT NULL", "'pass', 'fail', 'conditional_acceptance'"),
            ("9", "Inspector_id", "INTEGER", "FK (Users.Id)", "QA specialist performing check"),
            ("10", "Standards_checked", "VARCHAR(255)", "", "Quality benchmark (ISO, BIS, CE)"),
            ("11", "Remarks", "TEXT", "", "QA inspector observations"),
            ("12", "Inspected_at", "DATETIME", "DEFAULT NOW()", "Inspection timestamp")
        ]),
        ("Table 22: Returns", "Customer Order Returns (Modified with QA Status & Disposition)", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Return request ID"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant organization reference"),
            ("3", "Order_id", "VARCHAR(50)", "FK (Orders.Order_id)", "Associated customer order"),
            ("4", "Customer_id", "INTEGER", "FK (Customers.Id)", "Requesting customer"),
            ("5", "Return_reason", "VARCHAR(200)", "", "Customer reported reason"),
            ("6", "Refund_amount", "FLOAT", "", "Approved refund amount"),
            ("7", "Return_status", "VARCHAR(50)", "DEFAULT 'requested'", "'requested', 'in_inspection', 'approved', 'completed'"),
            ("8", "Qa_inspection_status", "VARCHAR(50)", "DEFAULT 'pending_qa'", "'pending_qa', 'qa_passed', 'qa_failed'"),
            ("9", "Disposition", "VARCHAR(50)", "", "'restock', 'refurbish', 'scrap', 'return_to_manufacturer'"),
            ("10", "Return_date", "DATETIME", "DEFAULT NOW()", "Return request date")
        ]),
        ("Table 23: Return_quality_inspections", "Quality Assurance: Manage Returns & Condition Assessment", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Return inspection audit ID"),
            ("2", "Return_id", "INTEGER", "FK (Returns.Id)", "Customer return record"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Returned product"),
            ("4", "Inspector_id", "INTEGER", "FK (Users.Id)", "QA inspector conducting check"),
            ("5", "Condition_grade", "VARCHAR(50)", "NOT NULL", "'sealed_new', 'opened_mint', 'damaged', 'defective'"),
            ("6", "Disposition", "VARCHAR(50)", "NOT NULL", "'restock_grade_a', 'refurbish', 'vendor_warranty', 'scrap'"),
            ("7", "Claim_against_manufacturer", "BOOLEAN", "DEFAULT FALSE", "Chargeback to manufacturer for defect"),
            ("8", "Refund_approval_status", "VARCHAR(50)", "DEFAULT 'approved'", "'approved', 'rejected', 'partial_deduction'"),
            ("9", "Inspection_notes", "TEXT", "", "Condition details and findings"),
            ("10", "Inspected_at", "DATETIME", "DEFAULT NOW()", "Inspection audit timestamp")
        ]),
        ("Table 24: Ml_models", "System Actor: Custom ML Model Registry & Architecture", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Model registry ID"),
            ("2", "Model_name", "VARCHAR(100)", "NOT NULL", "Name (e.g. 'demand_forecaster', 'churn_detector')"),
            ("3", "Version", "VARCHAR(50)", "NOT NULL", "Semantic version (e.g. 'v1.4.0')"),
            ("4", "Framework_type", "VARCHAR(50)", "NOT NULL", "'scikit-learn', 'xgboost', 'prophet', 'gemini-3.6'"),
            ("5", "Status", "VARCHAR(50)", "DEFAULT 'active'", "'active', 'training', 'candidate', 'deprecated'"),
            ("6", "Training_cadence", "VARCHAR(50)", "DEFAULT 'daily'", "'daily', 'hourly', 'event_triggered'"),
            ("7", "Last_trained_at", "DATETIME", "", "Latest training completion timestamp"),
            ("8", "Training_records_count", "INTEGER", "", "Historical dataset rows used"),
            ("9", "Primary_metric_name", "VARCHAR(50)", "", "Evaluation metric ('RMSE', 'ROC_AUC', 'F1')"),
            ("10", "Primary_metric_value", "FLOAT", "", "Validation score achieved"),
            ("11", "Artifact_path", "VARCHAR(255)", "", "Model serialized weights path / URI"),
            ("12", "Created_at", "DATETIME", "DEFAULT NOW()", "Registration date")
        ]),
        ("Table 25: Ml_training_logs", "System Actor: Daily Automated Continuous Learning History", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Training run audit ID"),
            ("2", "Model_id", "INTEGER", "FK (Ml_models.Id)", "Associated registered ML model"),
            ("3", "Training_date", "DATETIME", "DEFAULT NOW()", "Automated training run timestamp"),
            ("4", "New_data_points_learned", "INTEGER", "NOT NULL", "New daily delta rows absorbed into model"),
            ("5", "Data_source_snapshot", "VARCHAR(200)", "", "Snapshot descriptor (e.g. 'daily_sales_returns')"),
            ("6", "Evaluation_loss", "FLOAT", "", "Validation loss recorded on new data"),
            ("7", "Metric_improvement", "FLOAT", "", "Accuracy delta vs prior checkpoint"),
            ("8", "Drift_detected", "BOOLEAN", "DEFAULT FALSE", "Data/concept drift detected in daily data"),
            ("9", "Retrained_automatically", "BOOLEAN", "DEFAULT TRUE", "Autonomous daily cron trigger flag"),
            ("10", "Duration_seconds", "FLOAT", "", "Pipeline execution time in seconds"),
            ("11", "Status", "VARCHAR(50)", "DEFAULT 'success'", "'success', 'failed', 'evaluating'"),
            ("12", "Log_details", "TEXT", "", "Training stdout / hyperparameters / traceback")
        ]),
        ("Table 26: Ml_predictions", "System Actor: Automated Inference Output Repository", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Prediction record ID"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant organization reference"),
            ("3", "Model_id", "INTEGER", "FK (Ml_models.Id)", "Registered ML model generating output"),
            ("4", "Model_name", "VARCHAR(100)", "NOT NULL", "Model name descriptor"),
            ("5", "Target_entity_id", "VARCHAR(100)", "NOT NULL", "Target Product SKU, Customer ID, or Order ID"),
            ("6", "Prediction_type", "VARCHAR(50)", "NOT NULL", "'demand_forecast', 'churn_risk', 'restock_urgency'"),
            ("7", "Prediction_value", "FLOAT", "NOT NULL", "Calculated numeric prediction"),
            ("8", "Confidence_score", "FLOAT", "", "Statistical confidence interval (0.0 - 1.0)"),
            ("9", "Features_used", "JSON", "", "Input feature context snapshot"),
            ("10", "Created_at", "DATETIME", "DEFAULT NOW()", "Inference execution timestamp")
        ]),
        ("Table 27: Notifications", "Automated Business Alerts & Recommendations", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, AUTO_INC", "Notification identifier"),
            ("2", "Company_id", "INTEGER", "FK (Companies.Id)", "Tenant organization reference"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Referenced product (optional)"),
            ("4", "Message", "TEXT", "NOT NULL", "Alert message content"),
            ("5", "Type", "VARCHAR(50)", "DEFAULT 'info'", "'info', 'warning', 'low_stock', 'po_update', 'qa_alert'"),
            ("6", "Is_read", "BOOLEAN", "DEFAULT FALSE", "Viewed status flag"),
            ("7", "Action_taken", "BOOLEAN", "DEFAULT FALSE", "Actioned by staff flag"),
            ("8", "Created_at", "DATETIME", "DEFAULT NOW()", "Dispatch timestamp")
        ]),
        ("Table 28: Addresses", "Customer Shipping & Billing Addresses", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Address ID"),
            ("2", "Customer_id", "INTEGER", "FK (Customers.Id)", "Associated customer"),
            ("3", "Address_line_1", "VARCHAR(255)", "NOT NULL", "Street, building number"),
            ("4", "Address_line_2", "VARCHAR(255)", "", "Landmark, apartment"),
            ("5", "City", "VARCHAR(100)", "NOT NULL", "City"),
            ("6", "State", "VARCHAR(100)", "NOT NULL", "State / Province"),
            ("7", "Pincode", "VARCHAR(20)", "NOT NULL", "Postal PIN code"),
            ("8", "Is_default", "BOOLEAN", "DEFAULT FALSE", "Default address flag")
        ]),
        ("Table 29: Payments", "Payment Gateway Settlements", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Payment record ID"),
            ("2", "Order_id", "VARCHAR(50)", "FK (Orders.Order_id)", "Associated customer order"),
            ("3", "Payment_method", "VARCHAR(50)", "NOT NULL", "Gateway / payment instrument"),
            ("4", "Amount", "FLOAT", "NOT NULL", "Transaction amount"),
            ("5", "Transaction_id", "VARCHAR(100)", "UNIQUE", "Gateway transaction reference"),
            ("6", "Payment_date", "DATETIME", "DEFAULT NOW()", "Payment completion date"),
            ("7", "Status", "VARCHAR(50)", "DEFAULT 'completed'", "'initiated', 'completed', 'failed', 'refunded'")
        ]),
        ("Table 30: Shipping_methods", "Logistics Delivery Service Tiers", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Shipping tier ID"),
            ("2", "Name", "VARCHAR(100)", "NOT NULL", "Service tier (Standard, Express, Overnight)"),
            ("3", "Cost", "FLOAT", "NOT NULL", "Base delivery fee"),
            ("4", "Estimated_days", "INTEGER", "NOT NULL", "Guaranteed delivery transit days")
        ]),
        ("Table 31: Shipments", "Outbound Fulfillment Consignments", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Shipment ID"),
            ("2", "Order_id", "VARCHAR(50)", "FK (Orders.Order_id)", "Customer sales order"),
            ("3", "Shipping_method_id", "INTEGER", "FK (Shipping_methods.Id)", "Chosen courier tier"),
            ("4", "Tracking_number", "VARCHAR(100)", "UNIQUE", "Consignment tracking code"),
            ("5", "Status", "VARCHAR(50)", "DEFAULT 'manifested'", "'manifested', 'in_transit', 'delivered'"),
            ("6", "Shipped_date", "DATETIME", "", "Warehouse dispatch timestamp"),
            ("7", "Estimated_delivery", "DATETIME", "", "Expected customer arrival timestamp")
        ]),
        ("Table 32: Wishlists", "Customer Saved Items", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Wishlist entry ID"),
            ("2", "Customer_id", "INTEGER", "FK (Customers.Id)", "Customer saving item"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Bookmarked product"),
            ("4", "Added_date", "DATETIME", "DEFAULT NOW()", "Date added")
        ]),
        ("Table 33: Cart_items", "Active Shopping Carts", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Cart item ID"),
            ("2", "Customer_id", "INTEGER", "FK (Customers.Id)", "Customer cart owner"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Product in cart"),
            ("4", "Quantity", "INTEGER", "NOT NULL, DEFAULT 1", "Quantity added"),
            ("5", "Added_date", "DATETIME", "DEFAULT NOW()", "Date item added to cart")
        ]),
        ("Table 34: Reviews", "Customer Feedback & Sentiment", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Review ID"),
            ("2", "Customer_id", "INTEGER", "FK (Customers.Id)", "Reviewing customer"),
            ("3", "Product_id", "INTEGER", "FK (Products.Id)", "Reviewed product"),
            ("4", "Rating", "INTEGER", "NOT NULL", "Customer star rating (1 - 5)"),
            ("5", "Review_text", "TEXT", "", "Feedback commentary text"),
            ("6", "Sentiment_score", "FLOAT", "", "NLP polarity sentiment score (-1.0 to 1.0)"),
            ("7", "Created_at", "DATETIME", "DEFAULT NOW()", "Review creation date")
        ]),
        ("Table 35: Promotions", "Promotional Campaigns & AI Recommendations", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Promotion ID"),
            ("2", "Code", "VARCHAR(50)", "NOT NULL, UNIQUE", "Coupon promo code"),
            ("3", "Description", "VARCHAR(200)", "", "Promotional campaign summary"),
            ("4", "Discount_percentage", "FLOAT", "NOT NULL", "Discount percentage off"),
            ("5", "Start_date", "DATETIME", "NOT NULL", "Validity start timestamp"),
            ("6", "End_date", "DATETIME", "NOT NULL", "Validity expiration timestamp"),
            ("7", "Is_active", "BOOLEAN", "DEFAULT TRUE", "Campaign active toggle"),
            ("8", "Ai_recommended", "BOOLEAN", "DEFAULT FALSE", "Generated by AI dynamic pricing model")
        ]),
        ("Table 36: Document_analysis", "AI Document Ingestion & Extraction", [
            ("1", "Id", "INTEGER", "PRIMARY KEY, NOT NULL", "Document record ID"),
            ("2", "User_id", "INTEGER", "FK (Users.Id)", "Uploading user"),
            ("3", "Filename", "VARCHAR(255)", "NOT NULL", "Document filename"),
            ("4", "File_type", "VARCHAR(50)", "", "PDF, CSV, Excel, Image"),
            ("5", "Raw_text", "TEXT", "", "OCR / parsed text extract"),
            ("6", "Structured_insights", "JSON", "", "AI extracted structured metrics"),
            ("7", "Created_at", "DATETIME", "DEFAULT NOW()", "Ingestion timestamp")
        ])
    ]

    for title, subtitle, columns in tables_dict:
        t_flow = []
        t_flow.append(Paragraph(title, h2_style))
        t_flow.append(Paragraph(f"<i>{subtitle}</i>", body_style))
        t_flow.append(Spacer(1, 3))
        
        table_rows = [[
            Paragraph("<b>#</b>", th_style),
            Paragraph("<b>FIELD NAME</b>", th_style),
            Paragraph("<b>DATATYPE</b>", th_style),
            Paragraph("<b>CONSTRAINT</b>", th_style),
            Paragraph("<b>DESCRIPTION</b>", th_style),
        ]]
        
        for sr, col_name, dt, constraint, desc in columns:
            table_rows.append([
                Paragraph(sr, td_style),
                Paragraph(col_name, td_bold),
                Paragraph(dt, td_style),
                Paragraph(constraint, td_style),
                Paragraph(desc, td_style),
            ])
            
        col_widths = [24, 110, 85, 115, 206]
        col_table = Table(table_rows, colWidths=col_widths, repeatRows=1)
        col_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (0,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 4),
            ('RIGHTPADDING', (0,0), (-1,-1), 4),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        
        t_flow.append(col_table)
        t_flow.append(Spacer(1, 10))
        story.append(KeepTogether(t_flow))

    story.append(PageBreak())

    # SECTION 2: Master Relationships
    story.append(Paragraph("2. Complete Entity-Relationship (ER) Architecture", h1_style))
    story.append(Paragraph(
        "Below is the comprehensive mapping of all Foreign Keys, Cardinality, and operational relationship semantics.",
        body_style
    ))
    story.append(Spacer(1, 8))

    rel_rows = [[
        Paragraph("<b>SOURCE TABLE</b>", th_style),
        Paragraph("<b>FOREIGN KEY</b>", th_style),
        Paragraph("<b>TARGET TABLE (PK)</b>", th_style),
        Paragraph("<b>CARDINALITY</b>", th_style),
        Paragraph("<b>OPERATIONAL RELATIONSHIP DESCRIPTION</b>", th_style),
    ]]

    relationships = [
        ("users", "company_id", "companies(id)", "N : 1", "User belongs to an enterprise tenant organization"),
        ("products", "company_id", "companies(id)", "N : 1", "Product catalog partitioned by tenant company"),
        ("products", "manufacturer_id", "manufacturers(id)", "N : 1", "Product mapped to its OEM manufacturer"),
        ("categories", "company_id", "companies(id)", "N : 1", "Categories scoped to enterprise tenant"),
        ("categories", "parent_category_id", "categories(id)", "Self N : 1", "Self-referencing tree hierarchy for subcategories"),
        ("addresses", "customer_id", "customers(id)", "N : 1", "Multiple shipping/billing addresses per customer"),
        ("orders", "company_id", "companies(id)", "N : 1", "Order belongs to tenant enterprise"),
        ("orders", "customer_id", "customers(id)", "N : 1", "Order placed by a registered customer"),
        ("orders", "assigned_inventory_manager_id", "users(id)", "N : 1", "Inventory Manager supervising order fulfillment"),
        ("order_items", "order_id", "orders(order_id)", "N : 1", "Product line items composing customer order"),
        ("returns", "company_id", "companies(id)", "N : 1", "Tenant reference for returned items"),
        ("returns", "order_id", "orders(order_id)", "N : 1", "Customer return linked to original sales order"),
        ("returns", "customer_id", "customers(id)", "N : 1", "Customer initiating return request"),
        ("payments", "order_id", "orders(order_id)", "N : 1", "Payment transactions settling order balance"),
        ("shipments", "order_id", "orders(order_id)", "N : 1", "Outbound courier shipment dispatching order"),
        ("shipments", "shipping_method_id", "shipping_methods(id)", "N : 1", "Logistics delivery tier (Standard, Express)"),
        ("inventory", "company_id", "companies(id)", "N : 1", "Warehouse stock scoped by enterprise tenant"),
        ("inventory", "product_id", "products(id)", "N : 1", "Inventory tracking stock per product in warehouse"),
        ("inventory_adjustments", "inventory_id", "inventory(id)", "N : 1", "Inventory stock record being adjusted"),
        ("inventory_adjustments", "product_id", "products(id)", "N : 1", "Catalog product affected by stock audit"),
        ("inventory_adjustments", "performed_by", "users(id)", "N : 1", "Inventory manager conducting count/audit"),
        ("sales_fulfillments", "order_id", "orders(order_id)", "N : 1", "Fulfillment batch executing sales order"),
        ("sales_fulfillments", "inventory_manager_id", "users(id)", "N : 1", "Supervising Inventory Manager on picking line"),
        ("suppliers", "company_id", "companies(id)", "N : 1", "Suppliers contracted by enterprise company"),
        ("manufacturers", "company_id", "companies(id)", "N : 1", "Manufacturers partnered with company"),
        ("manufacturer_catalogs", "manufacturer_id", "manufacturers(id)", "N : 1", "OEM catalog items published by manufacturer"),
        ("manufacturer_catalogs", "product_id", "products(id)", "N : 1", "Internal product link for catalog SKU"),
        ("vmi_replenishments", "company_id", "companies(id)", "N : 1", "Tenant receiving VMI replenishment"),
        ("vmi_replenishments", "manufacturer_id", "manufacturers(id)", "N : 1", "Manufacturer proactively triggering restock"),
        ("vmi_replenishments", "product_id", "products(id)", "N : 1", "Product undergoing proactive replenishment"),
        ("purchase_orders", "company_id", "companies(id)", "N : 1", "Procurement order issued by tenant"),
        ("purchase_orders", "supplier_id", "suppliers(id)", "N : 1", "Supplier / vendor fulfilling purchase order"),
        ("purchase_orders", "created_by", "users(id)", "N : 1", "Purchase Manager user authoring and issuing PO"),
        ("purchase_order_items", "purchase_order_id", "purchase_orders(id)", "N : 1", "Procurement line items in purchase order"),
        ("purchase_order_items", "product_id", "products(id)", "N : 1", "Catalog product being procured"),
        ("supplier_evaluations", "supplier_id", "suppliers(id)", "N : 1", "Supplier scorecard audited by Purchase Manager"),
        ("supplier_evaluations", "manufacturer_id", "manufacturers(id)", "N : 1", "Manufacturer scorecard evaluated"),
        ("supplier_evaluations", "evaluator_id", "users(id)", "N : 1", "Purchase manager conducting evaluation"),
        ("margin_optimizations", "product_id", "products(id)", "N : 1", "Product financial cost-vs-price margin audit"),
        ("supply_chain_tracking", "purchase_order_id", "purchase_orders(id)", "N : 1", "PO shipment tracked via carrier milestones"),
        ("quality_inspections", "purchase_order_item_id", "purchase_order_items(id)", "N : 1", "Inbound shipment batch sampled for QA"),
        ("quality_inspections", "product_id", "products(id)", "N : 1", "Catalog product evaluated against standard"),
        ("quality_inspections", "inspector_id", "users(id)", "N : 1", "QA specialist performing quality check"),
        ("return_quality_inspections", "return_id", "returns(id)", "1 : 1", "QA inspection assessing customer returned item"),
        ("return_quality_inspections", "product_id", "products(id)", "N : 1", "Returned product graded for disposition"),
        ("return_quality_inspections", "inspector_id", "users(id)", "N : 1", "QA specialist performing return audit"),
        ("wishlists", "customer_id", "customers(id)", "N : 1", "Customer saving item to wishlist"),
        ("wishlists", "product_id", "products(id)", "N : 1", "Product saved in customer wishlist"),
        ("reviews", "customer_id", "customers(id)", "N : 1", "Customer submitting product review"),
        ("reviews", "product_id", "products(id)", "N : 1", "Product evaluated by customer review"),
        ("cart_items", "customer_id", "customers(id)", "N : 1", "Customer holding active shopping cart"),
        ("cart_items", "product_id", "products(id)", "N : 1", "Product stored in shopping cart"),
        ("document_analysis", "user_id", "users(id)", "N : 1", "User uploading invoice/document for analysis"),
        ("notifications", "company_id", "companies(id)", "N : 1", "Tenant receiving system alerts"),
        ("notifications", "product_id", "products(id)", "N : 1", "Referenced product for low stock / restock alert"),
        ("ml_training_logs", "model_id", "ml_models(id)", "N : 1", "Continuous learning daily run for model"),
        ("ml_predictions", "company_id", "companies(id)", "N : 1", "Tenant organization receiving ML inference"),
        ("ml_predictions", "model_id", "ml_models(id)", "N : 1", "Specific registered ML model producing inference")
    ]

    for src, fk, tgt, card, desc in relationships:
        rel_rows.append([
            Paragraph(f"<b>{src}</b>", td_bold),
            Paragraph(fk, td_style),
            Paragraph(tgt, td_style),
            Paragraph(f"<b>{card}</b>", td_style),
            Paragraph(desc, td_style),
        ])

    rel_table = Table(rel_rows, colWidths=[90, 95, 95, 45, 215], repeatRows=1)
    rel_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2563eb")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (3,0), (3,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(rel_table)

    # Build the PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built: {filename}")

if __name__ == '__main__':
    output_pdf = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Unified_Database_Schema_and_Relationships.pdf")
    build_pdf(output_pdf)
