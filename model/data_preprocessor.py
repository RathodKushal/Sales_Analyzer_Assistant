"""
E-Commerce Data Preprocessor for RL Model
============================================
Handles all data loading, cleaning, feature engineering, and encoding
for Indian e-commerce CRM data.

Loads multiple relational CSVs (customers, orders, order_items, payments,
returns) and merges them into a single transaction-level DataFrame with
RFM features, customer segmentation, and encoded categorical variables.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.cluster import KMeans
import joblib
import json


class EcommerceDataPreprocessor:
    """
    Loads Indian e-commerce data from multiple CSVs, cleans, engineers
    features (RFM, CLV, return rates), and encodes for the RL environment.

    Attributes:
        label_encoders: dict of fitted LabelEncoders keyed by column name
        scaler: fitted StandardScaler for continuous features
        feature_columns: list of feature column names used by the model
        discount_bins: the discrete discount levels available as actions
    """

    # Categorical columns to encode
    CATEGORICAL_COLS = [
        'State', 'Category', 'PaymentMethod', 'CustomerSegment', 'Gender'
    ]

    # Continuous features to scale
    CONTINUOUS_COLS = [
        'UnitPrice', 'Quantity', 'TotalAmount', 'Profit',
        'Age', 'CustomerLTV', 'DaysSinceLastPurchase',
        'PurchaseFrequency', 'AvgOrderValue', 'CustomerReturnRate',
    ]

    # Engineered time features
    TIME_FEATURES = [
        'OrderMonth', 'OrderDayOfWeek', 'OrderQuarter',
        'OrderHour', 'DaysSinceFirstPurchase',
    ]

    # Discrete discount levels (action space)
    DISCOUNT_BINS = [0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30]

    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.discount_bins = self.DISCOUNT_BINS
        self._is_fitted = False

    def load_data(self, data_dir: str) -> pd.DataFrame:
        """
        Load e-commerce data from a directory of CSVs or a single file.

        Args:
            data_dir: Path to directory containing CSVs, or path to a single file.

        Returns:
            Merged transaction-level DataFrame.
        """
        data_path = Path(data_dir)

        if data_path.is_file():
            # Single file mode (for uploaded datasets)
            return self._load_single_file(data_path)

        # Multi-CSV mode
        return self._load_multi_csv(data_path)

    def _load_single_file(self, filepath: Path) -> pd.DataFrame:
        """Load a single CSV/Excel file and adapt columns."""
        if filepath.suffix in ['.xlsx', '.xls']:
            df = pd.read_excel(filepath)
        elif filepath.suffix == '.csv':
            df = pd.read_csv(filepath, encoding='latin-1')
        else:
            raise ValueError(f"Unsupported file format: {filepath.suffix}")

        print(f"[Data] Loaded single file: {len(df)} records")
        return df

    def _load_multi_csv(self, data_dir: Path) -> pd.DataFrame:
        """Load and merge multiple relational CSVs."""
        print(f"[Data] Loading CSVs from {data_dir}...")

        # Load individual tables
        orders = pd.read_csv(data_dir / "orders.csv")
        order_items = pd.read_csv(data_dir / "order_items.csv")
        customers = pd.read_csv(data_dir / "customers.csv")
        payments = pd.read_csv(data_dir / "payments.csv")
        products = pd.read_csv(data_dir / "products.csv")

        # Load returns if available
        returns_path = data_dir / "returns.csv"
        if returns_path.exists():
            returns = pd.read_csv(returns_path)
        else:
            returns = pd.DataFrame(columns=["OrderID", "ReturnReason"])

        print(f"  Orders: {len(orders)}, Items: {len(order_items)}, "
              f"Customers: {len(customers)}, Payments: {len(payments)}, "
              f"Returns: {len(returns)}")

        # Merge order items with orders
        df = order_items.merge(orders, on="OrderID", how="left")

        # Merge with customer demographics
        df = df.merge(
            customers[['CustomerID', 'Gender', 'Age', 'State', 'City']],
            on="CustomerID", how="left", suffixes=('', '_cust')
        )

        # Merge with payment method
        df = df.merge(
            payments[['OrderID', 'PaymentMethod']],
            on="OrderID", how="left"
        )

        # Mark returned orders
        returned_order_ids = set(returns["OrderID"].astype(str).unique())
        df["IsReturn"] = df["OrderID"].astype(str).isin(returned_order_ids)

        # Use State from orders if available, fallback to customer
        if 'State' not in df.columns and 'State_cust' in df.columns:
            df['State'] = df['State_cust']
        elif 'State_cust' in df.columns:
            df['State'] = df['State'].fillna(df['State_cust'])

        # Fill category from products if not in items
        if 'Category' not in df.columns:
            df = df.merge(
                products[['StockCode', 'Category']],
                on='StockCode', how='left'
            )

        print(f"[Data] Merged: {len(df)} transaction records")
        return df

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean the raw dataframe: handle nulls, fix types, remove noise."""
        df = df.copy()

        # Parse order dates
        if 'OrderDate' in df.columns:
            df['OrderDate'] = pd.to_datetime(df['OrderDate'], errors='coerce')

        # Fill missing categorical values
        for col in ['State', 'Category', 'PaymentMethod', 'Gender']:
            if col in df.columns:
                df[col] = df[col].fillna('Unknown')

        # Fill missing numeric values
        for col in ['UnitPrice', 'Quantity', 'TotalAmount', 'Profit', 'Age']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                df[col] = df[col].fillna(df[col].median() if len(df) > 0 else 0)

        # Drop rows with critical nulls
        critical = ['TotalAmount', 'Quantity']
        existing_critical = [c for c in critical if c in df.columns]
        if existing_critical:
            df.dropna(subset=existing_critical, inplace=True)

        # Ensure positive quantities (returns are flagged separately)
        if 'Quantity' in df.columns:
            df['Quantity'] = df['Quantity'].abs()

        # Clip extreme outlier profits
        if 'Profit' in df.columns and len(df) > 0:
            profit_mean = df['Profit'].mean()
            profit_std = df['Profit'].std()
            if profit_std > 0:
                lower = profit_mean - 3 * profit_std
                upper = profit_mean + 3 * profit_std
                df['Profit'] = df['Profit'].clip(lower=lower, upper=upper)

        print(f"[Data] Cleaned: {len(df)} records remain")
        return df

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer e-commerce specific features including RFM metrics."""
        df = df.copy()

        # --- Time Features ---
        if 'OrderDate' in df.columns:
            df['OrderDate'] = pd.to_datetime(df['OrderDate'], errors='coerce')
            df['OrderMonth'] = df['OrderDate'].dt.month.fillna(6).astype(int)
            df['OrderDayOfWeek'] = df['OrderDate'].dt.dayofweek.fillna(3).astype(int)
            df['OrderQuarter'] = df['OrderDate'].dt.quarter.fillna(2).astype(int)
            df['OrderHour'] = df['OrderDate'].dt.hour.fillna(12).astype(int)
        else:
            for col in ['OrderMonth', 'OrderDayOfWeek', 'OrderQuarter', 'OrderHour']:
                df[col] = 6 if col == 'OrderMonth' else (3 if col == 'OrderDayOfWeek' else (2 if col == 'OrderQuarter' else 12))

        # --- RFM Features (per customer) ---
        if 'CustomerID' in df.columns and 'OrderDate' in df.columns:
            ref_date = df['OrderDate'].max() + pd.Timedelta(days=1)

            rfm = df.groupby('CustomerID').agg(
                Recency=('OrderDate', lambda x: (ref_date - x.max()).days),
                Frequency=('OrderID', 'nunique') if 'OrderID' in df.columns else ('OrderDate', 'count'),
                Monetary=('TotalAmount', 'sum') if 'TotalAmount' in df.columns else ('UnitPrice', 'sum'),
                FirstPurchase=('OrderDate', 'min'),
                AvgOrderValue=('TotalAmount', 'mean') if 'TotalAmount' in df.columns else ('UnitPrice', 'mean'),
            ).reset_index()

            rfm['DaysSinceFirstPurchase'] = (ref_date - rfm['FirstPurchase']).dt.days
            rfm.drop(columns=['FirstPurchase'], inplace=True)

            # Rename for merge
            rfm.rename(columns={
                'Recency': 'DaysSinceLastPurchase',
                'Frequency': 'PurchaseFrequency',
                'Monetary': 'CustomerLTV',
            }, inplace=True)

            # Compute return rate per customer
            if 'IsReturn' in df.columns:
                return_rate = df.groupby('CustomerID')['IsReturn'].mean().reset_index()
                return_rate.rename(columns={'IsReturn': 'CustomerReturnRate'}, inplace=True)
                rfm = rfm.merge(return_rate, on='CustomerID', how='left')
                rfm['CustomerReturnRate'] = rfm['CustomerReturnRate'].fillna(0)
            else:
                rfm['CustomerReturnRate'] = 0.0

            # --- Customer Segmentation (K-Means on RFM) ---
            rfm_features = rfm[['DaysSinceLastPurchase', 'PurchaseFrequency', 'CustomerLTV']].copy()
            rfm_scaled = StandardScaler().fit_transform(rfm_features)

            n_segments = min(5, max(2, len(rfm) // 50))
            kmeans = KMeans(n_clusters=n_segments, random_state=42, n_init=10)
            rfm['SegmentID'] = kmeans.fit_predict(rfm_scaled)

            # Label segments based on cluster centers
            cluster_stats = rfm.groupby('SegmentID').agg(
                mean_recency=('DaysSinceLastPurchase', 'mean'),
                mean_freq=('PurchaseFrequency', 'mean'),
                mean_ltv=('CustomerLTV', 'mean'),
            )

            # Score each cluster (lower recency + higher freq + higher LTV = better)
            cluster_stats['score'] = (
                -cluster_stats['mean_recency'] +
                cluster_stats['mean_freq'] * 10 +
                cluster_stats['mean_ltv'] / 1000
            )
            sorted_clusters = cluster_stats.sort_values('score', ascending=False).index.tolist()

            segment_labels = ['Champions', 'Loyal', 'Potential', 'At Risk', 'Lost']
            segment_map = {}
            for i, cluster_id in enumerate(sorted_clusters):
                segment_map[cluster_id] = segment_labels[min(i, len(segment_labels) - 1)]

            rfm['CustomerSegment'] = rfm['SegmentID'].map(segment_map)

            # Merge RFM features back into main DataFrame
            merge_cols = ['CustomerID', 'DaysSinceLastPurchase', 'PurchaseFrequency',
                          'CustomerLTV', 'AvgOrderValue', 'CustomerReturnRate',
                          'DaysSinceFirstPurchase', 'CustomerSegment']
            df = df.merge(rfm[merge_cols], on='CustomerID', how='left')

        else:
            # Fallback values if no CustomerID (or single prediction row):
            # Only set default 0 if the column was not already provided by the caller
            for col in ['DaysSinceLastPurchase', 'PurchaseFrequency', 'CustomerLTV',
                        'AvgOrderValue', 'CustomerReturnRate', 'DaysSinceFirstPurchase']:
                if col not in df.columns:
                    df[col] = 0.0
            if 'CustomerSegment' not in df.columns:
                df['CustomerSegment'] = 'Unknown'

        # Fill NaN in engineered features
        for col in self.CONTINUOUS_COLS + self.TIME_FEATURES:
            if col in df.columns:
                df[col] = df[col].fillna(0)

        if 'CustomerSegment' not in df.columns:
            df['CustomerSegment'] = 'Unknown'

        # --- Discount-to-Bin mapping (for RL actions) ---
        if 'Discount' in df.columns:
            df['Discount_Bin'] = df['Discount'].apply(self._map_discount_to_bin)
        else:
            df['Discount'] = 0.0
            df['Discount_Bin'] = 0

        print(f"[Data] Engineered features. Segments: {df['CustomerSegment'].value_counts().to_dict()}")
        return df

    def _map_discount_to_bin(self, discount: float) -> int:
        """Map a continuous discount value to the nearest discrete bin index."""
        distances = [abs(discount - b) for b in self.discount_bins]
        return int(np.argmin(distances))

    def encode_and_scale(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """Encode categorical features and scale continuous features."""
        df = df.copy()

        # --- Encode Categoricals ---
        for col in self.CATEGORICAL_COLS:
            if col not in df.columns:
                df[col] = 'Unknown'
            if fit:
                le = LabelEncoder()
                df[col + '_Enc'] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
            else:
                le = self.label_encoders.get(col)
                if le is None:
                    le = LabelEncoder()
                    df[col + '_Enc'] = le.fit_transform(df[col].astype(str))
                    self.label_encoders[col] = le
                else:
                    df[col + '_Enc'] = df[col].astype(str).apply(
                        lambda x: le.transform([x])[0] if x in le.classes_ else -1
                    )

        # --- Scale Continuous ---
        if hasattr(self.scaler, 'feature_names_in_') and self.scaler.feature_names_in_ is not None:
            scale_cols = list(self.scaler.feature_names_in_)
        else:
            scale_cols = [c for c in self.CONTINUOUS_COLS + self.TIME_FEATURES if c in df.columns]

        # Ensure all required scale columns exist in df
        for col in scale_cols:
            if col not in df.columns:
                df[col] = 0.0
            df[col] = df[col].fillna(0)

        if fit:
            df[scale_cols] = self.scaler.fit_transform(df[scale_cols])
        else:
            df[scale_cols] = self.scaler.transform(df[scale_cols])

        # --- Build feature column list ---
        self.feature_columns = (
            [c + '_Enc' for c in self.CATEGORICAL_COLS] +
            scale_cols
        )

        self._is_fitted = True
        print(f"[Data] Encoded & scaled. Feature vector size: {len(self.feature_columns)}")
        return df

    def get_state_vector(self, df: pd.DataFrame) -> np.ndarray:
        """Extract the state matrix (N x state_dim) from the processed DataFrame."""
        return df[self.feature_columns].values.astype(np.float32)

    def get_rewards(self, df: pd.DataFrame) -> np.ndarray:
        """Extract profit values as the reward signal."""
        if 'Profit' in df.columns:
            return df['Profit'].values.astype(np.float32)
        elif 'TotalAmount' in df.columns:
            return (df['TotalAmount'] * 0.15).values.astype(np.float32)
        else:
            return np.zeros(len(df), dtype=np.float32)

    def get_actions(self, df: pd.DataFrame) -> np.ndarray:
        """Extract the discount bin indices as historical actions."""
        return df['Discount_Bin'].values.astype(np.int64)

    def process(self, data_path: str) -> dict:
        """
        Full pipeline: load -> clean -> engineer -> encode -> extract.

        Returns:
            dict with keys: 'states', 'actions', 'rewards', 'dataframe',
                           'feature_columns', 'n_actions', 'state_dim'
        """
        df = self.load_data(data_path)
        df = self.clean(df)
        df = self.engineer_features(df)
        df = self.encode_and_scale(df, fit=True)

        states = self.get_state_vector(df)
        actions = self.get_actions(df)
        rewards = self.get_rewards(df)

        result = {
            'states': states,
            'actions': actions,
            'rewards': rewards,
            'dataframe': df,
            'feature_columns': self.feature_columns,
            'n_actions': len(self.discount_bins),
            'state_dim': states.shape[1],
        }

        print(f"[Data] Pipeline complete. States: {states.shape}, "
              f"Actions: {len(self.discount_bins)} bins, "
              f"Reward range: [{rewards.min():.2f}, {rewards.max():.2f}]")
        return result

    def save(self, directory: str):
        """Save the fitted preprocessor (encoders, scaler, config)."""
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)

        # Save label encoders
        for col, le in self.label_encoders.items():
            joblib.dump(le, directory / f"le_{col.replace(' ', '_')}.pkl")

        # Save scaler
        joblib.dump(self.scaler, directory / "scaler.pkl")

        # Save config
        config = {
            'feature_columns': self.feature_columns,
            'discount_bins': self.discount_bins,
            'categorical_cols': self.CATEGORICAL_COLS,
            'continuous_cols': self.CONTINUOUS_COLS,
            'time_features': self.TIME_FEATURES,
        }
        with open(directory / "preprocessor_config.json", 'w') as f:
            json.dump(config, f, indent=2)

        print(f"[Data] Preprocessor saved to {directory}")

    def load_saved(self, directory: str):
        """Load a previously saved preprocessor."""
        directory = Path(directory)
        parent_dir = directory.parent if directory.parent.exists() else directory

        # Load label encoders
        self.label_encoders = {}
        for col in self.CATEGORICAL_COLS:
            file_name = f"le_{col.replace(' ', '_')}.pkl"
            path = directory / file_name
            if not path.exists():
                path = parent_dir / file_name
            if path.exists():
                self.label_encoders[col] = joblib.load(path)

        # Load scaler
        scaler_path = directory / "scaler.pkl"
        if not scaler_path.exists():
            scaler_path = parent_dir / "scaler.pkl"
        if scaler_path.exists():
            self.scaler = joblib.load(scaler_path)

        # Load config
        config_path = directory / "preprocessor_config.json"
        if not config_path.exists():
            config_path = parent_dir / "preprocessor_config.json"
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
            self.feature_columns = config['feature_columns']
            self.discount_bins = config['discount_bins']

        self._is_fitted = True
        print(f"[Data] Preprocessor loaded from {directory}")
