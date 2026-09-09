"""
Indianize E-Commerce Dataset
==============================
Transforms the UK-based Online Retail dataset into an Indian e-commerce
context suitable for an Indian CRM platform.

Produces 6 relational CSVs:
  - customers.csv
  - orders.csv
  - order_items.csv
  - products.csv
  - payments.csv
  - returns.csv
"""

import pandas as pd
import numpy as np
from pathlib import Path
import random
import hashlib

# ── Configuration ────────────────────────────────────────────

SEED = 42
np.random.seed(SEED)
random.seed(SEED)

INPUT_PATH = Path(__file__).parent.parent / "data_extracted" / "data.csv"
OUTPUT_DIR = Path(__file__).parent

GBP_TO_INR = 105  # Approximate GBP to INR conversion rate

# ── Indian State Mapping (weighted by economic activity) ─────

# Map original countries to Indian states with realistic weights
COUNTRY_TO_STATE = {
    "United Kingdom": [
        ("Maharashtra", 0.22), ("Karnataka", 0.14), ("Delhi", 0.11),
        ("Tamil Nadu", 0.09), ("Gujarat", 0.08), ("Telangana", 0.07),
        ("Uttar Pradesh", 0.06), ("West Bengal", 0.05), ("Rajasthan", 0.04),
        ("Kerala", 0.04), ("Madhya Pradesh", 0.03), ("Punjab", 0.03),
        ("Haryana", 0.02), ("Bihar", 0.02),
    ],
    "France":       [("Andhra Pradesh", 1.0)],
    "Germany":      [("Punjab", 1.0)],
    "EIRE":         [("Haryana", 1.0)],
    "Spain":        [("Bihar", 1.0)],
    "Netherlands":  [("Odisha", 1.0)],
    "Belgium":      [("Jharkhand", 1.0)],
    "Switzerland":  [("Uttarakhand", 1.0)],
    "Portugal":     [("Goa", 1.0)],
    "Australia":    [("Chhattisgarh", 1.0)],
    "Norway":       [("Himachal Pradesh", 1.0)],
    "Italy":        [("Assam", 1.0)],
    "Channel Islands": [("Chandigarh", 1.0)],
    "Finland":      [("Tripura", 1.0)],
    "Cyprus":       [("Meghalaya", 1.0)],
    "Sweden":       [("Sikkim", 1.0)],
    "Austria":      [("Mizoram", 1.0)],
    "Denmark":      [("Manipur", 1.0)],
    "Japan":        [("Nagaland", 1.0)],
    "Poland":       [("Arunachal Pradesh", 1.0)],
    "Israel":       [("Puducherry", 1.0)],
    "Singapore":    [("Dadra and Nagar Haveli", 1.0)],
    "Iceland":      [("Ladakh", 1.0)],
    "Greece":       [("Jammu and Kashmir", 1.0)],
    "Lithuania":    [("Andaman and Nicobar", 1.0)],
    "Malta":        [("Lakshadweep", 1.0)],
    "United Arab Emirates": [("Telangana", 1.0)],
    "Lebanon":      [("Telangana", 1.0)],
    "Czech Republic": [("Rajasthan", 1.0)],
    "Bahrain":      [("Gujarat", 1.0)],
    "Saudi Arabia": [("Gujarat", 1.0)],
    "RSA":          [("Maharashtra", 1.0)],
    "Brazil":       [("West Bengal", 1.0)],
    "European Community": [("Karnataka", 1.0)],
    "USA":          [("Delhi", 1.0)],
    "Canada":       [("Tamil Nadu", 1.0)],
    "Unspecified":  [("Maharashtra", 1.0)],
}

# ── Indian Cities per State ──────────────────────────────────

STATE_CITIES = {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur", "Kolhapur"],
    "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum", "Dharwad", "Shimoga"],
    "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Connaught Place", "Karol Bagh"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
    "Telangana": ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam"],
    "Uttar Pradesh": ["Lucknow", "Noida", "Agra", "Varanasi", "Kanpur", "Ghaziabad", "Meerut"],
    "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
    "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
    "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar"],
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Nainital"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba"],
    "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
    "Chandigarh": ["Chandigarh"],
    "Tripura": ["Agartala"],
    "Meghalaya": ["Shillong"],
    "Sikkim": ["Gangtok"],
    "Mizoram": ["Aizawl"],
    "Manipur": ["Imphal"],
    "Nagaland": ["Kohima", "Dimapur"],
    "Arunachal Pradesh": ["Itanagar"],
    "Puducherry": ["Puducherry"],
    "Dadra and Nagar Haveli": ["Silvassa"],
    "Ladakh": ["Leh"],
    "Jammu and Kashmir": ["Srinagar", "Jammu"],
    "Andaman and Nicobar": ["Port Blair"],
    "Lakshadweep": ["Kavaratti"],
}

# ── Indian Pincode Ranges per State ──────────────────────────

STATE_PINCODE_RANGE = {
    "Maharashtra": (400001, 445999), "Karnataka": (560001, 591999),
    "Delhi": (110001, 110999), "Tamil Nadu": (600001, 643999),
    "Gujarat": (360001, 396999), "Telangana": (500001, 509999),
    "Uttar Pradesh": (201001, 285999), "West Bengal": (700001, 743999),
    "Rajasthan": (302001, 345999), "Kerala": (670001, 695999),
    "Madhya Pradesh": (450001, 488999), "Punjab": (140001, 160999),
    "Haryana": (121001, 136999), "Bihar": (800001, 855999),
    "Andhra Pradesh": (500001, 535999), "Odisha": (751001, 770999),
    "Jharkhand": (825001, 835999), "Uttarakhand": (246001, 263999),
    "Goa": (403001, 403999), "Chhattisgarh": (490001, 497999),
    "Himachal Pradesh": (171001, 177999), "Assam": (781001, 788999),
    "Chandigarh": (160001, 160999), "Tripura": (799001, 799999),
    "Meghalaya": (793001, 794999), "Sikkim": (737101, 737999),
    "Mizoram": (796001, 796999), "Manipur": (795001, 795999),
    "Nagaland": (797001, 797999), "Arunachal Pradesh": (790001, 792999),
    "Puducherry": (605001, 605999), "Dadra and Nagar Haveli": (396191, 396999),
    "Ladakh": (194101, 194999), "Jammu and Kashmir": (180001, 194999),
    "Andaman and Nicobar": (744101, 744999), "Lakshadweep": (682551, 682559),
}

# ── Indian Names ─────────────────────────────────────────────

INDIAN_FIRST_NAMES_M = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh",
    "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Advik", "Pranav",
    "Advait", "Dhruv", "Kabir", "Ritvik", "Aarush", "Kian", "Darsh",
    "Rohan", "Vikram", "Rahul", "Amit", "Suresh", "Rajesh", "Sanjay",
    "Deepak", "Manoj", "Nikhil", "Karthik", "Naveen", "Pradeep", "Sunil",
    "Ravi", "Anand", "Ganesh", "Mohan", "Prakash", "Harish", "Vishal",
    "Ajay", "Vinod", "Ashok", "Sachin", "Manish", "Rakesh", "Pankaj",
]

INDIAN_FIRST_NAMES_F = [
    "Saanvi", "Aanya", "Aadhya", "Aarohi", "Ananya", "Pari", "Anika",
    "Navya", "Myra", "Sara", "Diya", "Kiara", "Prisha", "Anvi",
    "Ira", "Kavya", "Riya", "Siya", "Tara", "Zara", "Meera",
    "Priya", "Neha", "Pooja", "Sneha", "Anjali", "Divya", "Shruti",
    "Nisha", "Rekha", "Sunita", "Lakshmi", "Radha", "Sita", "Geeta",
    "Kavita", "Seema", "Swati", "Jyoti", "Archana", "Manju", "Rashmi",
]

INDIAN_LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy",
    "Joshi", "Mishra", "Agarwal", "Mehta", "Nair", "Iyer", "Rao",
    "Desai", "Shah", "Bhat", "Pillai", "Chopra", "Malhotra", "Kapoor",
    "Chauhan", "Tiwari", "Pandey", "Saxena", "Banerjee", "Mukherjee",
    "Ghosh", "Chatterjee", "Das", "Bose", "Sen", "Patil", "Kulkarni",
    "Jain", "Goyal", "Sinha", "Yadav", "Thakur", "Rajput", "Naidu",
    "Menon", "Shetty", "Hegde", "Rathod", "Solanki", "Bhatt", "Trivedi",
]

# ── Payment Method Distribution ──────────────────────────────

PAYMENT_METHODS = ["UPI", "COD", "Credit Card", "Debit Card", "Net Banking"]
PAYMENT_WEIGHTS = [0.40, 0.25, 0.15, 0.12, 0.08]

# ── Return Reasons ───────────────────────────────────────────

RETURN_REASONS = [
    "Product not as described",
    "Damaged during shipping",
    "Wrong item delivered",
    "Size/fit issue",
    "Quality not satisfactory",
    "Changed mind",
    "Better price found elsewhere",
    "Late delivery",
    "Defective product",
    "Duplicate order",
]


# ── Product Category Mapping ─────────────────────────────────

def categorize_product(description: str) -> str:
    """Assign a product category based on description keywords."""
    if not isinstance(description, str):
        return "Miscellaneous"
    desc = description.upper()

    categories = {
        "Home Decor": ["CANDLE", "LIGHT", "LAMP", "LANTERN", "VASE", "FRAME",
                       "MIRROR", "CLOCK", "CUSHION", "PILLOW", "RUG", "CURTAIN",
                       "HANGING", "BUNTING", "GARLAND", "WREATH", "DECORATION"],
        "Kitchen & Dining": ["MUG", "CUP", "PLATE", "BOWL", "GLASS", "BOTTLE",
                             "CAKE", "NAPKIN", "KITCHEN", "COOK", "TRAY", "JAR",
                             "TEAPOT", "COASTER", "SPOON", "FORK", "KNIFE"],
        "Bags & Storage": ["BAG", "BASKET", "BOX", "CASE", "STORAGE", "TIN",
                           "CONTAINER", "POUCH", "HOLDER", "WALLET", "PURSE"],
        "Stationery & Office": ["PEN", "PENCIL", "NOTEBOOK", "CARD", "PAPER",
                                "STAMP", "STICKER", "TAG", "LABEL", "TAPE",
                                "RIBBON", "WRAP", "LETTER", "BOOK", "DIARY"],
        "Toys & Games": ["TOY", "GAME", "PUZZLE", "DOLL", "TEDDY", "PLAYHOUSE",
                         "RACING", "BUBBLE", "MAGIC", "ANIMAL", "DINOSAUR"],
        "Fashion & Accessories": ["JEWEL", "NECKLACE", "BRACELET", "EARRING",
                                  "RING", "CHARM", "BEAD", "SCARF", "HAT",
                                  "GLOVE", "SUNGLASS", "HAIRCLIP", "BROOCH"],
        "Garden & Outdoor": ["GARDEN", "PLANT", "FLOWER", "SEED", "BIRD",
                             "WATERING", "OUTDOOR", "DOORMAT", "UMBRELLA"],
        "Party & Celebration": ["PARTY", "BIRTHDAY", "CHRISTMAS", "EASTER",
                                "VALENTINE", "WEDDING", "CELEBRATION", "FAIRY",
                                "HEART", "STAR", "ANGEL", "SANTA"],
        "Textiles & Linen": ["TOWEL", "CLOTH", "FABRIC", "LINEN", "COTTON",
                             "SILK", "WOOL", "APRON", "TISSUE", "FLANNEL"],
    }

    for category, keywords in categories.items():
        if any(kw in desc for kw in keywords):
            return category

    return "Miscellaneous"


def assign_state(country: str) -> str:
    """Map a country to an Indian state using weighted distribution."""
    mapping = COUNTRY_TO_STATE.get(country, [("Maharashtra", 1.0)])
    states = [s for s, _ in mapping]
    weights = [w for _, w in mapping]
    return np.random.choice(states, p=weights)


def assign_city(state: str) -> str:
    """Pick a random city within a state."""
    cities = STATE_CITIES.get(state, ["Unknown"])
    return random.choice(cities)


def generate_pincode(state: str) -> str:
    """Generate a realistic Indian pincode for a state."""
    pin_range = STATE_PINCODE_RANGE.get(state, (100001, 999999))
    return str(random.randint(pin_range[0], pin_range[1]))


def generate_customer_name(gender: str) -> str:
    """Generate an Indian customer name."""
    if gender == "Male":
        first = random.choice(INDIAN_FIRST_NAMES_M)
    else:
        first = random.choice(INDIAN_FIRST_NAMES_F)
    last = random.choice(INDIAN_LAST_NAMES)
    return f"{first} {last}"


def generate_email(name: str, customer_id: int) -> str:
    """Generate a plausible Indian email from a name."""
    clean = name.lower().replace(" ", ".")
    domains = ["gmail.com", "yahoo.co.in", "outlook.com", "rediffmail.com", "hotmail.com"]
    domain = random.choice(domains)
    return f"{clean}{customer_id % 100}@{domain}"


def generate_phone() -> str:
    """Generate an Indian mobile number."""
    prefix = random.choice(["91", "92", "93", "94", "95", "96", "97", "98", "99", "70", "73", "74", "75", "76", "78", "79", "80", "81", "82", "83", "85", "86", "87", "88", "89"])
    suffix = "".join([str(random.randint(0, 9)) for _ in range(8)])
    return f"+91-{prefix}{suffix[:4]}-{suffix[4:]}"


def main():
    print("=" * 60)
    print("  INDIANIZE E-COMMERCE DATASET")
    print("=" * 60)

    # ── Step 1: Load raw data ──────────────────────────────
    print("\n[Step 1/8] Loading raw dataset...")
    df = pd.read_csv(INPUT_PATH, encoding="latin-1")
    print(f"  Loaded {len(df):,} records with {len(df.columns)} columns")

    # ── Step 2: Clean data ─────────────────────────────────
    print("\n[Step 2/8] Cleaning data...")
    # Drop records without CustomerID
    df = df.dropna(subset=["CustomerID"])
    df["CustomerID"] = df["CustomerID"].astype(int)
    # Drop records with invalid quantities or prices
    df = df[df["Quantity"] != 0]
    df = df[df["UnitPrice"] > 0]
    # Parse dates
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"], format="mixed")
    # Shift dates to 2023-2025 range (original is 2010-2011)
    min_date = df["InvoiceDate"].min()
    date_shift = pd.Timestamp("2023-01-01") - min_date
    df["InvoiceDate"] = df["InvoiceDate"] + date_shift
    print(f"  After cleaning: {len(df):,} records")
    print(f"  Date range: {df['InvoiceDate'].min().date()} to {df['InvoiceDate'].max().date()}")

    # ── Step 3: Detect returns ─────────────────────────────
    print("\n[Step 3/8] Detecting returns...")
    df["IsReturn"] = (
        df["InvoiceNo"].astype(str).str.startswith("C") |
        (df["Quantity"] < 0)
    )
    n_returns = df["IsReturn"].sum()
    print(f"  Found {n_returns:,} return records ({n_returns/len(df)*100:.1f}%)")

    # ── Step 4: Indianize geography ────────────────────────
    print("\n[Step 4/8] Mapping to Indian states & cities...")
    df["State"] = df["Country"].apply(assign_state)
    df["City"] = df["State"].apply(assign_city)
    df["Pincode"] = df["State"].apply(generate_pincode)
    print(f"  Mapped to {df['State'].nunique()} Indian states")
    print(f"  Top states: {dict(df['State'].value_counts().head(5))}")

    # ── Step 5: Convert prices to INR ──────────────────────
    print("\n[Step 5/8] Converting prices to INR...")
    df["UnitPrice_INR"] = (df["UnitPrice"] * GBP_TO_INR).round(2)
    df["TotalAmount"] = (df["Quantity"].abs() * df["UnitPrice_INR"]).round(2)
    print(f"  Price range: Rs.{df['UnitPrice_INR'].min():.2f} - Rs.{df['UnitPrice_INR'].max():.2f}")

    # ── Step 6: Categorize products ────────────────────────
    print("\n[Step 6/8] Categorizing products...")
    df["Category"] = df["Description"].apply(categorize_product)
    print(f"  Categories: {dict(df['Category'].value_counts())}")

    # ── Step 7: Generate customer profiles ─────────────────
    print("\n[Step 7/8] Generating customer profiles...")
    unique_customers = df["CustomerID"].unique()
    customer_records = []

    for cid in unique_customers:
        gender = np.random.choice(["Male", "Female"], p=[0.55, 0.45])
        name = generate_customer_name(gender)
        email = generate_email(name, cid)
        phone = generate_phone()
        # Get the most frequent state for this customer
        cust_data = df[df["CustomerID"] == cid]
        state = cust_data["State"].mode().iloc[0]
        city = assign_city(state)
        pincode = generate_pincode(state)
        age = random.randint(18, 65)

        customer_records.append({
            "CustomerID": cid,
            "Name": name,
            "Email": email,
            "Phone": phone,
            "Gender": gender,
            "Age": age,
            "State": state,
            "City": city,
            "Pincode": pincode,
        })

    customers_df = pd.DataFrame(customer_records)
    print(f"  Generated {len(customers_df):,} customer profiles")

    # ── Step 8: Build relational tables ────────────────────
    print("\n[Step 8/8] Building relational CSV files...")

    # --- Products table ---
    products_df = (
        df.groupby("StockCode")
        .agg(
            Description=("Description", "first"),
            Category=("Category", "first"),
            AvgPrice=("UnitPrice_INR", "mean"),
            TotalQuantitySold=("Quantity", lambda x: x[x > 0].sum()),
            TotalRevenue=("TotalAmount", lambda x: x[x > 0].sum()),
        )
        .reset_index()
    )
    products_df["AvgPrice"] = products_df["AvgPrice"].round(2)
    products_df["TotalRevenue"] = products_df["TotalRevenue"].round(2)
    products_df.index.name = None
    print(f"  Products: {len(products_df):,}")

    # --- Orders table ---
    orders_grouped = df.groupby("InvoiceNo").agg(
        CustomerID=("CustomerID", "first"),
        OrderDate=("InvoiceDate", "first"),
        State=("State", "first"),
        City=("City", "first"),
        TotalAmount=("TotalAmount", "sum"),
        TotalItems=("Quantity", lambda x: x.abs().sum()),
        IsReturn=("IsReturn", "any"),
    ).reset_index()
    orders_grouped.rename(columns={"InvoiceNo": "OrderID"}, inplace=True)
    orders_grouped["Status"] = orders_grouped["IsReturn"].map(
        {True: "Returned", False: "Completed"}
    )
    orders_grouped["TotalAmount"] = orders_grouped["TotalAmount"].abs().round(2)
    orders_grouped["TotalItems"] = orders_grouped["TotalItems"].astype(int)

    # Generate discount (0-30% random, weighted towards lower)
    orders_grouped["Discount"] = np.random.choice(
        [0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30],
        size=len(orders_grouped),
        p=[0.35, 0.20, 0.18, 0.12, 0.08, 0.04, 0.03],
    )
    # Estimate profit (8-25% margin minus discount impact)
    base_margin = np.random.uniform(0.08, 0.25, size=len(orders_grouped))
    orders_grouped["Profit"] = (
        orders_grouped["TotalAmount"] * (base_margin - orders_grouped["Discount"] * 0.5)
    ).round(2)
    # Negative profit for returns
    orders_grouped.loc[orders_grouped["IsReturn"], "Profit"] = (
        -orders_grouped.loc[orders_grouped["IsReturn"], "TotalAmount"] * 0.05
    ).round(2)

    print(f"  Orders: {len(orders_grouped):,}")

    # --- Order Items table ---
    order_items_df = df[["InvoiceNo", "StockCode", "Description", "Quantity",
                          "UnitPrice_INR", "TotalAmount", "IsReturn"]].copy()
    order_items_df.rename(columns={
        "InvoiceNo": "OrderID",
        "UnitPrice_INR": "UnitPrice",
        "IsReturn": "IsReturned",
    }, inplace=True)
    order_items_df["Quantity"] = order_items_df["Quantity"].abs()
    order_items_df["TotalAmount"] = order_items_df["TotalAmount"].abs().round(2)
    print(f"  Order Items: {len(order_items_df):,}")

    # --- Payments table ---
    payments = []
    for _, order in orders_grouped.iterrows():
        method = np.random.choice(PAYMENT_METHODS, p=PAYMENT_WEIGHTS)
        status = "Refunded" if order["IsReturn"] else "Completed"
        payments.append({
            "OrderID": order["OrderID"],
            "PaymentMethod": method,
            "Amount": order["TotalAmount"],
            "Status": status,
        })
    payments_df = pd.DataFrame(payments)
    print(f"  Payments: {len(payments_df):,}")

    # --- Returns table ---
    returned_orders = orders_grouped[orders_grouped["IsReturn"]].copy()
    returns = []
    for _, ret in returned_orders.iterrows():
        reason = random.choice(RETURN_REASONS)
        refund_pct = random.uniform(0.7, 1.0)
        returns.append({
            "OrderID": ret["OrderID"],
            "CustomerID": ret["CustomerID"],
            "ReturnReason": reason,
            "RefundAmount": round(ret["TotalAmount"] * refund_pct, 2),
            "ReturnStatus": np.random.choice(
                ["Refund Processed", "Refund Pending", "Exchange"],
                p=[0.65, 0.20, 0.15]
            ),
            "ReturnDate": ret["OrderDate"] + pd.Timedelta(days=random.randint(3, 30)),
        })
    returns_df = pd.DataFrame(returns)
    print(f"  Returns: {len(returns_df):,}")

    # ── Save all CSVs ──────────────────────────────────────
    print("\n[Saving] Writing CSV files to data/...")
    customers_df.to_csv(OUTPUT_DIR / "customers.csv", index=False)
    orders_grouped.drop(columns=["IsReturn"]).to_csv(OUTPUT_DIR / "orders.csv", index=False)
    order_items_df.to_csv(OUTPUT_DIR / "order_items.csv", index=False)
    products_df.to_csv(OUTPUT_DIR / "products.csv", index=False)
    payments_df.to_csv(OUTPUT_DIR / "payments.csv", index=False)
    returns_df.to_csv(OUTPUT_DIR / "returns.csv", index=False)

    print("\n" + "=" * 60)
    print("  INDIANIZATION COMPLETE!")
    print("=" * 60)
    print(f"  Customers: {len(customers_df):,}")
    print(f"  Orders:    {len(orders_grouped):,}")
    print(f"  Items:     {len(order_items_df):,}")
    print(f"  Products:  {len(products_df):,}")
    print(f"  Payments:  {len(payments_df):,}")
    print(f"  Returns:   {len(returns_df):,}")
    print(f"  Output:    {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
