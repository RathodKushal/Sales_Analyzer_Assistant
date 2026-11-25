import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, 'screenshots')
OUTPUT_PDF = os.path.join(BASE_DIR, 'Final_Year_Project_Comprehensive_Viva_Guide.pdf')
WORKSPACE_PDF = os.path.join(os.path.dirname(BASE_DIR), 'Final_Year_Project_Comprehensive_Viva_Guide.pdf')

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
        if self._pageNumber == 1:
            return  # Suppress running header/footer on title cover page
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(45, 800, "AUTONOMOUS E-COMMERCE SUPPLY CHAIN, POS & AI ANALYTICS SUITE")
        self.setFont("Helvetica", 8)
        self.drawRightString(550, 800, "FINAL YEAR CAPSTONE VIVA GUIDE")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(45, 792, 550, 792)

        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(45, 30, "Confidential — Prepared for External Practical & Viva Examination")
        self.drawRightString(550, 30, page_text)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(45, 42, 550, 42)
        self.restoreState()

def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=55,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    # Custom Palettes
    PRIMARY = colors.HexColor("#0f172a")     # Slate 900
    SECONDARY = colors.HexColor("#1e293b")   # Slate 800
    ACCENT = colors.HexColor("#0284c7")      # Sky 600
    SUCCESS = colors.HexColor("#059669")     # Emerald 600
    WARNING = colors.HexColor("#d97706")     # Amber 600
    TEXT_DARK = colors.HexColor("#0f172a")   # Near black
    TEXT_MUTED = colors.HexColor("#475569")  # Slate 600
    BG_LIGHT = colors.HexColor("#f8fafc")    # Slate 50
    BORDER_LIGHT = colors.HexColor("#e2e8f0")# Slate 200

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        alignment=1, # Center
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=TEXT_MUTED,
        alignment=1,
        spaceAfter=24
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=SECONDARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Header3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=ACCENT,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=15,
        bulletIndent=5,
        spaceAfter=4
    )

    caption_style = ParagraphStyle(
        'Caption',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_MUTED,
        alignment=1, # Center
        spaceBefore=4,
        spaceAfter=10
    )

    qa_q_style = ParagraphStyle(
        'QAQuestion',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    qa_a_style = ParagraphStyle(
        'QAAnswer',
        parent=body_style,
        fontSize=9,
        leading=13.5,
        spaceAfter=8
    )

    story = []

    # ── COVER / TITLE PAGE ───────────────────────────────────────────
    story.append(Spacer(1, 40))
    story.append(Paragraph("AUTONOMOUS E-COMMERCE SUPPLY CHAIN, POS &amp; AI ANALYTICS SUITE", title_style))
    story.append(Paragraph("Complete Technical Project Architecture, Role Manual &amp; External Viva Examination Guide", subtitle_style))
    
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceBefore=10, spaceAfter=20))

    # Metadata Grid Box
    meta_data = [
        [Paragraph("<b>Project Category:</b> Final Year Engineering Capstone", body_style),
         Paragraph("<b>Architecture:</b> 6 Role-Based Portals + 4 AI Engines", body_style)],
        [Paragraph("<b>Primary Backend:</b> Python 3.13, FastAPI, SQLAlchemy ORM", body_style),
         Paragraph("<b>Primary Frontend:</b> React 18, Vite, Tailwind CSS, Framer Motion", body_style)],
        [Paragraph("<b>AI / ML Core:</b> PyTorch Dueling DDQN, Meta Prophet, Scikit-learn", body_style),
         Paragraph("<b>Database:</b> SQLite (Unified 20+ Tables Schema)", body_style)],
        [Paragraph("<b>Author / Candidate:</b> Final Year Engineering Candidate", body_style),
         Paragraph("<b>Document Scope:</b> Comprehensive Project Manual &amp; Viva Q&amp;A", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[250, 255])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_LIGHT),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 25))

    # Executive Summary Paragraph
    exec_text = (
        "<b>Executive Summary:</b> Modern commercial enterprises frequently suffer from severe data fragmentation "
        "between storefront billing, warehouse storage, vendor procurement, and pricing decisions. This project introduces "
        "an end-to-end, production-grade enterprise web application that unifies retail Point-of-Sale (POS) operations with an "
        "autonomous multi-stage supply chain and self-optimizing Reinforcement Learning (RL) and time-series AI engines. "
        "The system enforces strict Role-Based Access Control (RBAC) across six isolated operational domains: System Admin, "
        "Inventory Management, Procurement &amp; Purchase Orders, Vendor Manufacturing, Quality Assurance, and POS Cashier Operations. "
        "Real-time transactions immediately synchronize with live Dueling Double Deep Q-Networks (DDQN) for dynamic discount tiering, "
        "Meta Prophet Bayesian forecasting for demand planning, and 5-class hype momentum vectorization."
    )
    story.append(Paragraph(exec_text, body_style))
    story.append(Spacer(1, 20))

    # Login UI Cover Screenshot
    login_img_path = os.path.join(SCREENSHOTS_DIR, '01_login_page.png')
    if os.path.exists(login_img_path):
        story.append(Image(login_img_path, width=500, height=315))
        story.append(Paragraph("<b>Figure 1:</b> System Login Portal featuring 1-Click Role-Based Quick Access Selectors and JWT Authentication.", caption_style))

    story.append(PageBreak())

    # ── SECTION 1: SYSTEM ARCHITECTURE & TECH STACK ───────────────────
    story.append(Paragraph("1. System Architecture &amp; Engineering Stack", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT, spaceAfter=12))

    story.append(Paragraph(
        "The application is engineered on a decoupled, asynchronous client-server architecture adhering to RESTful principles. "
        "State synchronization across micro-workflows occurs over HTTP JSON APIs with immediate transactional consistency guaranteed by SQLAlchemy ORM.",
        body_style
    ))

    tech_table_data = [
        [Paragraph("<b>Component Layer</b>", body_bold), Paragraph("<b>Technologies Used</b>", body_bold), Paragraph("<b>Key Responsibilities &amp; Implementations</b>", body_bold)],
        [
            Paragraph("<b>Frontend Client</b>", body_style),
            Paragraph("React 18, Vite 8, Tailwind CSS, Framer Motion, Axios, React Hot Toast, Lucide/HeroIcons", body_style),
            Paragraph("Single Page Application (SPA), role-gated routes, glassmorphism UI, real-time cart state, modal dialogues, isolated printable iframe receipts.", body_style)
        ],
        [
            Paragraph("<b>Backend API Server</b>", body_style),
            Paragraph("Python 3.13, FastAPI, Uvicorn ASGI Server, Pydantic v2, Python-Jose (JWT)", body_style),
            Paragraph("Asynchronous REST API, modular APIRouters, request payload validation, password hashing (bcrypt), token issuance, atomic database sessions.", body_style)
        ],
        [
            Paragraph("<b>Database &amp; Storage</b>", body_style),
            Paragraph("SQLite 3, SQLAlchemy 2.0 ORM, Alembic schema migrations", body_style),
            Paragraph("Unified relational schema encompassing 20+ tables: users, products, suppliers, restock_requests, orders, order_items, customers, and returns.", body_style)
        ],
        [
            Paragraph("<b>AI / ML Engines</b>", body_style),
            Paragraph("PyTorch, Meta Prophet, Scikit-learn, Pandas, NumPy, Joblib", body_style),
            Paragraph("Dueling DDQN reinforcement learning for discount policies, additive Bayesian time-series sales forecasting, rolling sales momentum classification.", body_style)
        ]
    ]

    t_tech = Table(tech_table_data, colWidths=[100, 160, 245])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, BORDER_LIGHT),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Unified End-to-End Workflow Diagram:", h2_style))
    story.append(Paragraph(
        "<code>[POS Cashier / Billing] &rarr; (Stock Reduction) &rarr; [Warehouse Inventory Hub] &rarr; (Restock Request) &rarr; "
        "[Purchase Order Dept] &rarr; (Approved PO) &rarr; [Manufacturer Production] &rarr; (Shipment) &rarr; "
        "[Quality Assurance (QA)] &rarr; [PO Goods Receipt Note (GRN)] &rarr; (Stock Addition) &rarr; [Warehouse Hub]</code>",
        ParagraphStyle('CodeBlock', parent=body_style, fontName='Courier', fontSize=8.5, leading=12, textColor=ACCENT)
    ))
    story.append(Spacer(1, 14))

    # ── SECTION 2: ROLE-BY-ROLE OPERATIONAL BREAKDOWN ─────────────────
    story.append(Paragraph("2. Operational Roles &amp; Portal Walkthrough", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT, spaceAfter=12))

    story.append(Paragraph(
        "The project enforces strict separation of concerns via custom Role-Based Route Guards (<code>RoleRoute.jsx</code>) "
        "and dynamic navigation visibility in <code>Sidebar.jsx</code>. Users can only access the views and endpoints authorized for their specific job function.",
        body_style
    ))

    # ROLE 1: ADMIN
    story.append(Paragraph("2.1 System Administrator (Master Control Center)", h2_style))
    story.append(Paragraph(
        "<b>Authorized Route:</b> <code>/admin</code> | <b>Default Credentials:</b> <code>admin / admin123</code><br/>"
        "<b>Core Functions:</b><br/>"
        "&bull; <b>Executive KPI Telemetry:</b> Real-time monitoring of Gross Merchandise Value (GMV), net revenue, active product counts, registered users, and database footprint.<br/>"
        "&bull; <b>User Administration &amp; Access Governance:</b> Creating accounts, assigning roles (Admin, Inventory, Purchase, Manufacturer, QA, Sales), activating/deactivating users, and administrative password resets.<br/>"
        "&bull; <b>Approved Product Catalog Gate:</b> The Admin portal strictly lists products that have been verified and activated by the Purchase Order Manager (<code>approval_status == 'active'</code>). Products awaiting procurement review are hidden from admin catalogs to prevent premature commercial commitments.<br/>"
        "&bull; <b>Central Billing &amp; Sales Forecasting:</b> Full visibility into cashier terminals, transaction receipts, customer purchase patterns, and Prophet sales forecasts.",
        body_style
    ))
    admin_img = os.path.join(SCREENSHOTS_DIR, '02_admin_dashboard.png')
    if os.path.exists(admin_img):
        story.append(Image(admin_img, width=500, height=295))
        story.append(Paragraph("<b>Figure 2:</b> System Administrator Master Control Center showing system telemetry, operational metrics, and user management.", caption_style))

    story.append(PageBreak())

    # ROLE 2: INVENTORY MANAGER
    story.append(Paragraph("2.2 Inventory Manager (Warehouse &amp; Stock Control Hub)", h2_style))
    story.append(Paragraph(
        "<b>Authorized Route:</b> <code>/dashboard/inventory</code> | <b>Default Credentials:</b> <code>inventory / inventory123</code><br/>"
        "<b>Core Functions:</b><br/>"
        "&bull; <b>Physical Stock Accounting:</b> Real-time visualization of current inventory levels, SKU tracking, reorder thresholds, and out-of-stock risk signals.<br/>"
        "&bull; <b>Catalog Segregation ('The Products We Have' vs. 'Approval Queue'):</b> Active, approved products ready for distribution appear in the primary catalog. Newly registered or pending replenishment products are placed in an isolated Restock Queue.<br/>"
        "&bull; <b>Initiating Restock &amp; New Product Requests:</b> Warehouse personnel cannot directly alter supply contracts. When stock is low or a new item is requested, the Inventory Manager enters the exact requested quantity (e.g., 20 units) and submits it to the Purchase Order Manager.<br/>"
        "&bull; <b>Stock Adjustment Audit:</b> Logs all manual write-offs, damages, and return restocks.",
        body_style
    ))
    inv_img = os.path.join(SCREENSHOTS_DIR, '03_inventory_hub.png')
    if os.path.exists(inv_img):
        story.append(Image(inv_img, width=500, height=295))
        story.append(Paragraph("<b>Figure 3:</b> Warehouse &amp; Inventory Hub displaying active stock levels, SKU tracking, and the Approval &amp; Restock Queue.", caption_style))

    story.append(Spacer(1, 10))

    # ROLE 3: PURCHASE ORDER MANAGER
    story.append(Paragraph("2.3 Procurement &amp; Purchase Order Manager", h2_style))
    story.append(Paragraph(
        "<b>Authorized Route:</b> <code>/dashboard/purchase-orders</code> | <b>Default Credentials:</b> <code>purchase_order_items / purchase123</code><br/>"
        "<b>Core Functions:</b><br/>"
        "&bull; <b>Inbound Request Review:</b> Evaluates replenishment and new product proposals submitted by the Warehouse Hub.<br/>"
        "&bull; <b>Purchase Order (PO) Issuance:</b> Approves requests and dispatches binding Purchase Orders with unique PO numbers (e.g., <code>PO-2026-RESTOCK-0001</code>) to assigned manufacturer vendors.<br/>"
        "&bull; <b>Multi-Stage Procurement Pipeline Tracking:</b> Tracks real-time order status across 4 dedicated filter tabs: <i>Awaiting PO</i>, <i>With Manufacturer</i>, <i>Ready to Restock</i>, and <i>Restocked</i>.<br/>"
        "&bull; <b>Goods Receipt Note (GRN) &amp; Return Back Statement:</b> Once manufacturers ship completed goods, the PO Manager verifies compliance and executes an official Return Back Statement voucher, which atomically credits the exact quantity into inventory stock.<br/>"
        "&bull; <b>Integrated POS Billing Access:</b> Direct header and sidebar links allowing procurement officers to access cashier terminals.",
        body_style
    ))
    po_img = os.path.join(SCREENSHOTS_DIR, '04_purchase_orders.png')
    if os.path.exists(po_img):
        story.append(Image(po_img, width=500, height=295))
        story.append(Paragraph("<b>Figure 4:</b> Procurement &amp; Purchase Orders Dashboard featuring multi-stage pipeline status tabs and direct PO issuance.", caption_style))

    story.append(PageBreak())

    # ROLE 4: MANUFACTURER / VENDOR
    story.append(Paragraph("2.4 Manufacturer &amp; Vendor Portal", h2_style))
    story.append(Paragraph(
        "<b>Authorized Route:</b> <code>/dashboard/manufacturers</code> | <b>Default Credentials:</b> <code>manufacturers / manufacturers123</code><br/>"
        "<b>Core Functions:</b><br/>"
        "&bull; <b>Vendor-Managed Inventory (VMI) Visibility:</b> Contracted suppliers view assigned purchase orders dispatched by the procurement department.<br/>"
        "&bull; <b>Production &amp; Assembly Execution:</b> Manufacturers click 'Accept Order' to acknowledge receipt and transition the job status from <code>ordered_to_manufacturer</code> to <code>accepted_by_manufacturer</code>.<br/>"
        "&bull; <b>Shipment Dispatch:</b> Upon manufacturing completion, the vendor clicks 'Mark as Shipped' with consignment details. This transitions the order to <code>shipped_to_purchase</code>, alerting the PO Manager that goods are ready for inspection and warehouse handover.",
        body_style
    ))
    mfg_img = os.path.join(SCREENSHOTS_DIR, '05_manufacturer_portal.png')
    if os.path.exists(mfg_img):
        story.append(Image(mfg_img, width=500, height=290))
        story.append(Paragraph("<b>Figure 5:</b> Manufacturer &amp; VMI Portal showing purchase order acceptance, assembly status, and shipment dispatch.", caption_style))

    story.append(Spacer(1, 10))

    # ROLE 5: QUALITY ASSURANCE & INSPECTION
    story.append(Paragraph("2.5 Quality Assurance &amp; Inspections (QA/QC)", h2_style))
    story.append(Paragraph(
        "<b>Authorized Route:</b> <code>/dashboard/quality-inspections</code> | <b>Default Credentials:</b> <code>quality_inspections / quality123</code><br/>"
        "<b>Core Functions:</b><br/>"
        "&bull; <b>Lot &amp; Batch Auditing:</b> Inspectors inspect incoming consignments and returned goods against strict quality parameters.<br/>"
        "&bull; <b>Compliance Scoring &amp; Defect Classification:</b> Categorizes defects (cosmetic, mechanical, packaging), calculating batch acceptance percentages.<br/>"
        "&bull; <b>Quarantine vs. Clearance:</b> Items passing quality verification receive stock transfer approval; non-compliant batches are flagged for supplier return or RMA processing.",
        body_style
    ))
    qa_img = os.path.join(SCREENSHOTS_DIR, '06_quality_assurance.png')
    if os.path.exists(qa_img):
        story.append(Image(qa_img, width=500, height=290))
        story.append(Paragraph("<b>Figure 6:</b> Quality Assurance Dashboard detailing inspection checklists, defect classification, and compliance telemetry.", caption_style))

    story.append(PageBreak())

    # ROLE 6: SALES / POS BILLING
    story.append(Paragraph("2.6 Sales Representative &amp; POS Billing Terminal", h2_style))
    story.append(Paragraph(
        "<b>Authorized Route:</b> <code>/billing</code> | <b>Accessible by:</b> Admin, Purchase Orders, Sales / Users<br/>"
        "<b>Core Functions:</b><br/>"
        "&bull; <b>Cashier Terminal &amp; Product Search:</b> Real-time catalog lookup displaying live warehouse stock levels and unit prices.<br/>"
        "&bull; <b>Overselling Prevention:</b> The shopping cart strictly restricts quantity selection to available stock (<code>quantity &le; max_stock</code>), eliminating negative inventory race conditions.<br/>"
        "&bull; <b>Customer Auto-Linking:</b> Cashier inputs customer phone or email; existing customer records are linked automatically, while new customers are seamlessly registered in the centralized database.<br/>"
        "&bull; <b>Tax &amp; Discount Computation:</b> Configurable GST brackets (0%, 5%, 12%, 18%, 28%) and overall bill discounts.<br/>"
        "&bull; <b>Atomic Stock Reduction:</b> On clicking 'Generate Bill', an atomic SQLAlchemy transaction writes to <code>orders</code> and <code>order_items</code>, immediately decrementing warehouse product stock.<br/>"
        "&bull; <b>Crisp PDF Tax Invoicing:</b> Renders an isolated, high-contrast, black-and-white printable tax invoice receipt with GSTIN, itemized line items, and financial summaries, completely resolving blank-page PDF export issues.",
        body_style
    ))
    pos_img = os.path.join(SCREENSHOTS_DIR, '07_pos_billing.png')
    if os.path.exists(pos_img):
        story.append(Image(pos_img, width=500, height=315))
        story.append(Paragraph("<b>Figure 7:</b> Point of Sale (POS) Billing Terminal with live catalog search, stock validation, cart controls, and payment breakdown.", caption_style))

    story.append(PageBreak())

    # ── SECTION 3: CUSTOMER DIRECTORY & PRODUCT CATALOG ───────────────
    story.append(Paragraph("3. Customer Intelligence &amp; Master Product Catalog", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT, spaceAfter=12))

    story.append(Paragraph("3.1 Real Buyer Customer Directory with Live Search (`/customers`)", h2_style))
    story.append(Paragraph(
        "To ensure high data integrity, the customer directory strictly purges seeded or dummy mock records. "
        "The customer list is dynamically synthesized solely from transactional records in <code>orders</code> and <code>order_items</code>. "
        "For every customer, the system aggregates: <b>Customer Name</b>, <b>Contact Phone/Email</b>, <b>Total Orders Placed</b>, "
        "<b>Cumulative Spend (₹)</b>, and <b>Last Purchase Timestamp</b>. A debounced live search bar allows instantaneous filtering across "
        "name, phone, email, or customer ID with a dedicated zero-result empty state.",
        body_style
    ))
    cust_img = os.path.join(SCREENSHOTS_DIR, '08_customers_directory.png')
    if os.path.exists(cust_img):
        story.append(Image(cust_img, width=500, height=270))
        story.append(Paragraph("<b>Figure 8:</b> Customer Intelligence Directory showing real billing buyers, cumulative spend, order frequency, and live search.", caption_style))

    story.append(Spacer(1, 10))

    story.append(Paragraph("3.2 Master Unified Product Catalog (`/products`)", h2_style))
    story.append(Paragraph(
        "The master product catalog synchronizes SKUs across all business units. In accordance with the procurement protocol, "
        "only products bearing an <code>approval_status == 'active'</code> are displayed in the active commercial catalog. "
        "Each card provides instant visibility into stock codes, current warehouse stock, unit pricing, assigned manufacturer vendor, "
        "and catalog activation controls.",
        body_style
    ))
    prod_img = os.path.join(SCREENSHOTS_DIR, '09_products_catalog.png')
    if os.path.exists(prod_img):
        story.append(Image(prod_img, width=500, height=270))
        story.append(Paragraph("<b>Figure 9:</b> Master Unified Product Catalog displaying active inventory SKUs, stock levels, and vendor associations.", caption_style))

    story.append(PageBreak())

    # ── SECTION 4: THE 4 AUTONOMOUS AI ENGINES ────────────────────────
    story.append(Paragraph("4. The Four Autonomous AI &amp; Machine Learning Engines", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT, spaceAfter=12))

    story.append(Paragraph(
        "A cornerstone of this final-year capstone project is the replacement of static, rule-based retail logic with "
        "four self-learning artificial intelligence algorithms. All four engines read directly from live billing and order records.",
        body_style
    ))

    # AI 1: DISCOUNT AI
    story.append(Paragraph("4.1 Discount AI — Dueling Double Deep Q-Network (DDQN)", h2_style))
    story.append(Paragraph(
        "<b>Algorithm:</b> Reinforcement Learning (PyTorch Dueling DDQN with Prioritized Experience Replay)<br/>"
        "<b>Problem Solved:</b> Traditional static discount rules erode profit margins or fail to convert high-value customers. "
        "The Dueling DDQN dynamically learns the optimal discount tier (0%, 5%, 10%, 15%, 20%, 25%, 30%) for each customer-product interaction.<br/>"
        "<b>Mathematical State Space (s):</b> A 5-dimensional normalized vector: "
        "<code>s = [Recency, Frequency, Monetary Value (RFM), Return Rate, Customer Lifetime Value (CLV)]</code>.<br/>"
        "<b>Dueling Architecture:</b> Separates the state value function <i>V(s)</i> from the action advantage function <i>A(s, a)</i>: "
        "<code>Q(s, a) = V(s) + (A(s, a) - 1/|A| &sum; A(s, a'))</code>. This decouples state assessment from action advantage, "
        "drastically reducing overestimation bias in high-variance e-commerce environments.<br/>"
        "<b>Reward Function:</b> <code>R = (Revenue - Wholesale Cost) &times; Conversion Probability - Churn Penalty</code>.",
        body_style
    ))
    disc_img = os.path.join(SCREENSHOTS_DIR, '10_discount_ai.png')
    if os.path.exists(disc_img):
        story.append(Image(disc_img, width=500, height=270))
        story.append(Paragraph("<b>Figure 10:</b> Discount AI Dashboard detailing Dueling DDQN loss convergence, RFM state representation, and recommended discount tiers.", caption_style))

    story.append(PageBreak())

    # AI 2: PRODUCT HYPE AI
    story.append(Paragraph("4.2 Product Hype AI — Multi-Class Momentum Velocity Vectorization", h2_style))
    story.append(Paragraph(
        "<b>Algorithm:</b> Temporal Momentum Vectorization &amp; 5-Class Velocity Classifier<br/>"
        "<b>Problem Solved:</b> Rapidly detecting shifting consumer demand trends before warehouse stockouts or deadstock pileups occur.<br/>"
        "<b>Mechanism:</b> Extracts rolling monthly order quantities from <code>order_items</code> over a 6-month historical sliding window. "
        "Calculates first-order momentum velocity: <code>&Delta;v = (Sales_t - Sales_{t-1}) / &sigma;(Sales)</code> and acceleration <code>a = &Delta;v / &Delta;t</code>.<br/>"
        "<b>5-Class Momentum Output:</b><br/>"
        "&bull; <b>Viral (Velocity &gt; +100%):</b> Exponential sales surge; triggers immediate procurement reorder.<br/>"
        "&bull; <b>Growing (+20% to +100%):</b> Stable upward trajectory; recommended for featured merchandising.<br/>"
        "&bull; <b>Steady (-10% to +20%):</b> Balanced equilibrium; standard replenishment frequency.<br/>"
        "&bull; <b>Slight Drop (-10% to -40%):</b> Fading demand; flags need for promotional discount campaign.<br/>"
        "&bull; <b>Severe Drop (&lt; -40%):</b> High deadstock risk; halts procurement replenishment.",
        body_style
    ))
    hype_img = os.path.join(SCREENSHOTS_DIR, '11_product_hype_ai.png')
    if os.path.exists(hype_img):
        story.append(Image(hype_img, width=500, height=270))
        story.append(Paragraph("<b>Figure 11:</b> Product Hype AI Dashboard showing rolling sales vectors, momentum velocity, and 5-class hype classifications.", caption_style))

    story.append(Spacer(1, 10))

    # AI 3: SALES FORECASTING
    story.append(Paragraph("4.3 Sales Forecasting — Meta Prophet Bayesian Additive Regression", h2_style))
    story.append(Paragraph(
        "<b>Algorithm:</b> Meta Prophet (Bayesian Additive Time-Series Model with Seasonal Decompositions)<br/>"
        "<b>Mathematical Formula:</b> <code>y(t) = g(t) + s(t) + h(t) + &epsilon;_t</code><br/>"
        "Where <i>g(t)</i> represents non-linear piecewise linear trend, <i>s(t)</i> models periodic weekly/annual seasonality via Fourier series, "
        "<i>h(t)</i> captures commercial holiday anomalies, and <i>&epsilon;_t</i> represents the normally distributed error term.<br/>"
        "<b>Graceful Fallback Mechanism:</b> In commercial retail scenarios where historical transaction points are limited (e.g. freshly launched stores), "
        "standard Prophet models crash or produce 0 predictions. Our service implements an intelligent adaptive fallback that computes 7-day "
        "exponentially weighted moving averages (EMA) when records are &lt; 10, ensuring continuous, reliable revenue projections.",
        body_style
    ))
    fc_img = os.path.join(SCREENSHOTS_DIR, '12_sales_forecast.png')
    if os.path.exists(fc_img):
        story.append(Image(fc_img, width=500, height=270))
        story.append(Paragraph("<b>Figure 12:</b> Sales Forecast Dashboard displaying Meta Prophet predicted revenue trajectories, confidence intervals, and category breakouts.", caption_style))

    story.append(PageBreak())

    # AI 4: DEMAND ANALYSIS
    story.append(Paragraph("4.4 Demand Analysis &amp; Warehouse Stockout Prevention", h2_style))
    story.append(Paragraph(
        "<b>Algorithm:</b> Inventory-to-Sales Ratio &amp; Dynamic Safety Stock Thresholding<br/>"
        "<b>Mechanism:</b> Continuously aggregates units sold from POS billing invoices and contrasts them against warehouse on-hand stock.<br/>"
        "<b>Safety Stock Formula:</b> <code>Safety_Stock = Z &times; &sigma;_L &times; &radic;(Lead_Time)</code>, where <i>Z</i> represents service level z-score (95% = 1.65).<br/>"
        "<b>Reorder Point (ROP):</b> <code>ROP = (Average Daily Sales &times; Vendor Lead Time) + Safety Stock</code>.<br/>"
        "When current stock drops below the calculated ROP, an automated restock recommendation badge is dispatched to the Inventory and Purchase Order dashboards.",
        body_style
    ))
    dem_img = os.path.join(SCREENSHOTS_DIR, '13_demand_analysis.png')
    if os.path.exists(dem_img):
        story.append(Image(dem_img, width=500, height=315))
        story.append(Paragraph("<b>Figure 13:</b> Demand Analysis Dashboard showing real units sold vs warehouse inventory, stockout risks, and replenishment signals.", caption_style))

    story.append(PageBreak())

    # ── SECTION 5: EXTERNAL VIVA PREPARATION QUESTIONS & ANSWERS ──────
    story.append(Paragraph("5. External Viva Examination: Top 25 Questions &amp; Model Answers", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT, spaceAfter=14))

    story.append(Paragraph(
        "The following questions cover the exact technical, architectural, and theoretical concepts external examiners frequently probe during final year capstone project evaluations.",
        body_style
    ))

    qa_list = [
        # Architecture & Framework
        ("Q1. What is the fundamental architecture of your system, and why did you choose FastAPI over Flask or Django?",
         "Our system follows a decoupled Single Page Application (SPA) architecture with React 18 on the client and FastAPI on the backend. We chose FastAPI because of its asynchronous ASGI performance (benchmarked significantly faster than WSGI frameworks like Flask), native Pydantic data validation which guarantees type safety at runtime, and automatic OpenAPI/Swagger interactive documentation generation."),

        ("Q2. How is authentication and Role-Based Access Control (RBAC) implemented in this application?",
         "Authentication utilizes industry-standard JSON Web Tokens (JWT). When a user submits credentials, the server verifies the bcrypt-hashed password. On success, a signed JWT containing user ID and role claims is returned with a 24-hour expiration. On the frontend, custom RoleRoute guards inspect token claims and block unauthorized navigation. On the backend, FastAPI dependency injection dependencies (e.g. Depends(get_current_user), Depends(require_admin)) enforce endpoint-level authorization."),

        ("Q3. What database did you use, and how are relationships maintained across 20+ tables?",
         "We used SQLite for zero-configuration relational persistence, orchestrated via SQLAlchemy 2.0 ORM. Foreign key constraints enforce referential integrity across users, products, suppliers, restock_requests, orders, order_items, and customers. One-to-many relationships (e.g., one order containing multiple order_items) are maintained using relationship() mappings with cascading options."),

        # Supply Chain Workflow
        ("Q4. Explain the exact step-by-step lifecycle of a restock request in your supply chain.",
         "1. Warehouse inventory drops below safety threshold &rarr; Inventory Manager initiates a Restock Request for a specific quantity (e.g., 20 units). Status = 'pending_purchase_approval'.\n"
         "2. PO Manager reviews request &rarr; accepts and issues an official Purchase Order to the designated manufacturer. Status = 'ordered_to_manufacturer'.\n"
         "3. Manufacturer logs in &rarr; accepts PO and starts production. Status = 'accepted_by_manufacturer'.\n"
         "4. Manufacturer completes batch &rarr; marks shipment as dispatched. Status = 'shipped_to_purchase'.\n"
         "5. PO Manager inspects shipment &rarr; signs Goods Receipt Note (GRN) / Return Back Statement. Status = 'received_and_restocked', and product stock is atomically incremented in warehouse inventory."),

        ("Q5. How does your system prevent a product from appearing in sales before procurement approval?",
         "We implemented an approval_status gate in the products table. Newly added products are flagged as 'pending_approval' and stay in the inventory Approval Queue. The Admin catalog, POS billing catalog, and KPI stats execute query filters enforcing 'approval_status == active'. Only after the Purchase Order Manager approves the item does it transition to active."),

        # POS & Billing
        ("Q6. How do you prevent inventory overselling during POS billing?",
         "We enforce two layers of validation: client-side, the cart dynamically bounds quantity inputs to max_stock, disabling addition if stock is zero. Server-side, inside an atomic database transaction (db.begin()), the service queries current stock; if requested quantity > current stock, it raises an HTTP 400 exception before writing order items. On success, stock is immediately decremented."),

        ("Q7. How did you resolve the blank PDF invoice generation problem?",
         "The previous implementation printed the entire page via window.print(), where fixed modal containers with overflow-hidden and Tailwind dark-mode classes (text-white) caused Chromium print engines to clip containers or print white text on white paper. We resolved this by building generatePrintableInvoiceHtml(), which renders a self-contained, high-contrast light-mode HTML document injected into an isolated hidden iframe that triggers print(), guaranteeing crisp, clean A4 PDFs."),

        # AI & Machine Learning
        ("Q8. Why did you use a Dueling DDQN for the Discount AI instead of standard Q-learning or Linear Regression?",
         "Standard Q-learning suffers from maximization bias (systematically overestimating action values), especially in volatile retail environments. Dueling DDQN solves this with two innovations: First, Double Q-learning decouples action selection (via online network) from action evaluation (via target network). Second, the Dueling architecture separates state-value V(s) from action advantages A(s, a). This allows the agent to evaluate whether a customer state is valuable regardless of the discount chosen, dramatically stabilizing training."),

        ("Q9. What are the inputs (state space) and outputs (action space) of your Discount AI?",
         "State Space: A 5-dimensional normalized continuous vector comprising: 1. Recency (days since last purchase), 2. Frequency (total purchase count), 3. Monetary Value (total spend) — forming RFM scores, 4. Historical Return Rate, and 5. Estimated Customer Lifetime Value (CLV). Action Space: 7 discrete discount tiers: [0%, 5%, 10%, 15%, 20%, 25%, 30%]."),

        ("Q10. How does the Meta Prophet Sales Forecasting algorithm work?",
         "Prophet is a decomposable additive time-series regression model formulated as y(t) = g(t) + s(t) + h(t) + e_t. Here, g(t) models non-linear trend using piecewise linear growth with changepoint detection; s(t) models periodic patterns (weekly and yearly seasonality) using Fourier series; h(t) accounts for holiday effects; and e_t represents noise. It handles missing data and regime shifts without requiring extensive data stationarity transformations."),

        ("Q11. What is the fallback mechanism in your forecasting engine if transaction history is minimal?",
         "Bayesian models like Prophet require sufficient historical datapoints (typically >= 10 periods) to fit Fourier coefficients and trend changepoints. If a newly registered store has fewer than 10 points, the backend catches the statistical deficit and gracefully computes a 7-day Exponential Moving Average (EMA) fallback, preventing zero or NaN errors on the frontend."),

        ("Q12. Explain the 5 classes in your Product Hype AI and how momentum is computed.",
         "We extract rolling monthly sales vectors over a 6-month window from order_items. Momentum velocity is computed as v = (Sales_t - Sales_{t-1}) / std_dev. The 5 classes are: 1. Viral (surge > 100%), 2. Growing (+20% to +100%), 3. Steady (-10% to +20%), 4. Slight Drop (-10% to -40%), and 5. Severe Drop (< -40%). This provides early warning signals for proactive inventory replenishment or promotional discounting."),

        # Database & Concurrency
        ("Q13. How does the system handle concurrent billing transactions on the same product stock?",
         "In SQLite/SQLAlchemy, write transactions acquire an exclusive database lock. When multiple cashier requests hit the server simultaneously, each transaction performs an atomic decrement (Product.stock = Product.stock - qty) inside a managed session context. If stock reaches zero, subsequent concurrent operations fail the availability check and are rolled back."),

        ("Q14. Why are customers in the Customer Directory built only from real billing data?",
         "In real-world CRM analytics, mock or dummy customers corrupt statistical distributions for RFM modeling, customer retention calculations, and machine learning inference. By dynamically synthesizing customer profiles strictly from verified sales records in orders and order_items, all customer telemetry represents genuine purchasing behavior."),

        ("Q15. How is the requested quantity bug fixed across the procurement pipeline?",
         "Previously, several response schemas and modal defaults contained a hardcoded fallback value of 50 units. We updated backend schemas (RestockRequestResponse, RestockRequestCreate), the service layer, and frontend modal state bindings to strictly map data.requested_quantity. Now, whether an inventory manager requests 20 or 200 units, the exact number propagates across PO, manufacturer production, shipping, GRN, and inventory crediting.")
    ]

    for q, a in qa_list:
        story.append(Paragraph(q, qa_q_style))
        story.append(Paragraph(a.replace('\n', '<br/>'), qa_a_style))

    # Build the PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Master PDF generated successfully at: {OUTPUT_PDF}")

    # Copy to workspace root for convenience
    try:
        import shutil
        shutil.copyfile(OUTPUT_PDF, WORKSPACE_PDF)
        print(f"Copied PDF to workspace root: {WORKSPACE_PDF}")
    except Exception as e:
        print(f"Notice: workspace copy: {e}")

if __name__ == '__main__':
    build_pdf()
