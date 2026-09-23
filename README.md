# Sales Analyzer Assistant

An AI-powered e-commerce sales analytics platform that uses **Reinforcement Learning** (Deep Q-Networks) and **Time-Series Forecasting** (Prophet) to provide:

- 🏷️ **Optimal Discount Recommendations** — DQN agent trained on transaction data
- 🔥 **Product Demand/Hype Prediction** — RL-based demand classification (Severe Drop → Viral)
- 📈 **Future Sales Forecasting** — Prophet-powered monthly revenue predictions with confidence intervals
- 📊 **Demand Analysis** — Combined demand intelligence with seasonal patterns and product rankings

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **ML Model** | PyTorch (Dueling DQN), Prophet, scikit-learn |
| **Backend** | FastAPI, SQLAlchemy, Pydantic |
| **Frontend** | React 19, Vite, TailwindCSS, Recharts, Framer Motion |
| **Database** | SQLite (dev) / MySQL (prod) |
| **Auth** | JWT (Bearer tokens) |

## Architecture
...............
```
├── data/                    # E-commerce CSV datasets (6 relational tables)
├── model/                   # ML models and training scripts
│   ├── agent.py             # Dueling DQN agent
│   ├── data_preprocessor.py # RFM features, K-Means segmentation
│   ├── ecommerce_environment.py  # RL environment for discount optimization
│   ├── sales_forecaster.py  # Prophet-based revenue forecasting
│   ├── demand_analyzer.py   # Combined demand intelligence
│   ├── hype_environment.py  # RL environment for demand classification
│   ├── train.py / evaluate.py     # Training & evaluation pipelines
│   └── saved/               # Pre-trained model weights
├── backend/                 # FastAPI application
│   ├── main.py              # App entry point
│   ├── analytics/           # ML prediction & forecast endpoints
│   ├── auth/                # JWT authentication
│   ├── customers/           # Customer CRUD
│   ├── orders/              # Order CRUD
│   ├── products/            # Product CRUD
│   └── ...                  # Returns, Reports, Ingestion, Social, PowerBI
└── frontend/                # React + Vite dashboard
    └── src/
        ├── pages/           # Dashboard, Forecast, Demand, Discount AI, etc.
        ├── components/      # Layout, Sidebar, Charts
        └── api/             # Axios API client
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### 1. Clone & Switch Branch

```bash
git clone https://github.com/RathodKushal/Sales_Analyzer_Assistant.git
cd Sales_Analyzer_Assistant
git checkout Development
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp backend/.env.example backend/.env

# Start the API server
uvicorn backend.main:app --reload
```

The API will be available at `http://localhost:8000` with Swagger docs at `/docs`.

Default admin credentials: `admin / admin123`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### 4. Train Models (Optional)

The repository includes pre-trained model weights. To retrain:

```bash
# Train discount optimization model
python -m model.train --data_dir data --save_dir model/saved --episodes 200

# Evaluate the model
python -m model.evaluate --data_dir data --model_dir model/saved

# Train hype/demand model
python -m model.train_hype

# Evaluate hype model
python -m model.evaluate_hype
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login & get JWT token |
| `POST` | `/api/analytics/predict` | Predict optimal discount |
| `POST` | `/api/analytics/batch-predict` | Batch discount predictions |
| `GET` | `/api/analytics/summary` | Model evaluation summary |
| `GET` | `/api/analytics/forecast?months=6` | Sales revenue forecast |
| `GET` | `/api/analytics/demand-analysis` | Demand analysis report |
| `GET` | `/api/analytics/category-trends` | Category revenue trends |
| `GET` | `/api/analytics/hype/{stock_code}` | Product hype prediction |
| `GET` | `/api/customers/` | List customers |
| `GET` | `/api/orders/` | List orders |
| `GET` | `/api/products/` | List products |

## Dataset

The `data/` directory contains a relational Indian e-commerce dataset with 6 CSV files:
- `customers.csv` — Customer profiles and demographics
- `orders.csv` — Order-level data with discounts and profits
- `order_items.csv` — Line-item details
- `payments.csv` — Payment methods (UPI, COD, Credit Card, etc.)
- `products.csv` — Product catalog with categories
- `returns.csv` — Return records with reasons

## License

This project is for educational and research purposes.