"""
Data Preprocessor for Sales Analytics RL Model
================================================
Handles all data loading, cleaning, feature engineering, and encoding.
Produces a structured DataFrame ready for the RL environment.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import json


class SalesDataPreprocessor:
    """
    Loads raw sales data from Excel/CSV, cleans it, engineers features,
    and encodes categorical variables for use by the RL environment.
    
    Attributes:
        label_encoders: dict of fitted LabelEncoders keyed by column name
        scaler: fitted StandardScaler for continuous features
        feature_columns: list of feature column names used by the model
        discount_bins: the discrete discount levels available as actions
    """

    # Categorical columns to encode
    CATEGORICAL_COLS = [
        'Ship Mode', 'Segment', 'Region', 'Category', 'Sub-Category'
    ]

    # Continuous features to scale
    CONTINUOUS_COLS = [
        'Quantity', 'Base_Sales'  # Base_Sales = Sales before discount effect
    ]

    # Engineered time features
    TIME_FEATURES = [
        'Order_Month', 'Order_DayOfWeek', 'Order_Quarter',
        'Ship_Days'
    ]

    # Discrete discount levels (action space)
    DISCOUNT_BINS = [0.0, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5]

    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.discount_bins = self.DISCOUNT_BINS
        self._is_fitted = False

    def load_data(self, filepath: str) -> pd.DataFrame:
        """Load sales data from Excel or CSV file."""
        filepath = Path(filepath)
        if filepath.suffix in ['.xlsx', '.xls']:
            df = pd.read_excel(filepath)
        elif filepath.suffix == '.csv':
            df = pd.read_csv(filepath)
        else:
            raise ValueError(f"Unsupported file format: {filepath.suffix}")
        
        print(f"[Data] Loaded {len(df)} records with {len(df.columns)} columns")
        return df

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean the raw dataframe: handle nulls, fix types, remove noise."""
        df = df.copy()

        # Drop the index-like column 'A`' if present
        if 'A`' in df.columns:
            df.drop(columns=['A`'], inplace=True)

        # Fill missing postal codes (11 nulls) with 0 — not critical for RL
        if 'Postal Code' in df.columns:
            df['Postal Code'].fillna(0, inplace=True)

        # Ensure date columns are datetime
        for col in ['Order Date', 'Ship Date']:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')

        # Drop rows with critical nulls (Sales, Profit, Quantity)
        critical_cols = ['Sales', 'Profit', 'Quantity', 'Discount']
        df.dropna(subset=[c for c in critical_cols if c in df.columns], inplace=True)

        # Clip extreme outliers in Profit (beyond 3 standard deviations)
        profit_mean = df['Profit'].mean()
        profit_std = df['Profit'].std()
        lower = profit_mean - 3 * profit_std
        upper = profit_mean + 3 * profit_std
        df['Profit'] = df['Profit'].clip(lower=lower, upper=upper)

        print(f"[Data] Cleaned: {len(df)} records remain after cleaning")
        return df

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer new features from the raw data."""
        df = df.copy()

        # --- Time Features ---
        if 'Order Date' in df.columns:
            df['Order_Month'] = df['Order Date'].dt.month
            df['Order_DayOfWeek'] = df['Order Date'].dt.dayofweek
            df['Order_Quarter'] = df['Order Date'].dt.quarter

        # Shipping duration in days
        if 'Order Date' in df.columns and 'Ship Date' in df.columns:
            df['Ship_Days'] = (df['Ship Date'] - df['Order Date']).dt.days
            df['Ship_Days'] = df['Ship_Days'].clip(lower=0)  # no negatives

        # --- Base Sales (estimated sales before discount was applied) ---
        # Sales in the dataset is already the discounted price.
        # Base_Sales = Sales / (1 - Discount), handle 0-discount case
        df['Base_Sales'] = df.apply(
            lambda row: row['Sales'] / (1 - row['Discount'])
            if row['Discount'] < 1.0 else row['Sales'],
            axis=1
        )

        # --- Profit Margin ---
        df['Profit_Margin'] = df['Profit'] / df['Sales'].replace(0, np.nan)
        df['Profit_Margin'].fillna(0, inplace=True)

        # --- Discount-to-Bin mapping (for RL actions) ---
        df['Discount_Bin'] = df['Discount'].apply(self._map_discount_to_bin)

        print(f"[Data] Engineered {len(self.TIME_FEATURES) + 3} new features")
        return df

    def _map_discount_to_bin(self, discount: float) -> int:
        """Map a continuous discount value to the nearest discrete bin index."""
        distances = [abs(discount - b) for b in self.discount_bins]
        return int(np.argmin(distances))

    def encode_and_scale(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """
        Encode categorical features and scale continuous features.
        
        Args:
            df: DataFrame with engineered features
            fit: If True, fit the encoders/scaler. If False, use already-fitted ones.
        
        Returns:
            DataFrame with encoded and scaled features
        """
        df = df.copy()

        # --- Encode Categoricals ---
        for col in self.CATEGORICAL_COLS:
            if col not in df.columns:
                continue
            if fit:
                le = LabelEncoder()
                df[col + '_Enc'] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
            else:
                le = self.label_encoders[col]
                # Handle unseen categories by mapping to -1
                df[col + '_Enc'] = df[col].astype(str).apply(
                    lambda x: le.transform([x])[0] if x in le.classes_ else -1
                )

        # --- Scale Continuous ---
        continuous_present = [c for c in self.CONTINUOUS_COLS if c in df.columns]
        time_present = [c for c in self.TIME_FEATURES if c in df.columns]
        
        scale_cols = continuous_present + time_present
        if fit:
            df[scale_cols] = self.scaler.fit_transform(df[scale_cols])
        else:
            df[scale_cols] = self.scaler.transform(df[scale_cols])

        # --- Build feature column list ---
        self.feature_columns = (
            [c + '_Enc' for c in self.CATEGORICAL_COLS if c in df.columns] +
            continuous_present +
            time_present
        )

        self._is_fitted = True
        print(f"[Data] Encoded & scaled. Feature vector size: {len(self.feature_columns)}")
        return df

    def get_state_vector(self, df: pd.DataFrame) -> np.ndarray:
        """Extract the state matrix (N x state_dim) from the processed DataFrame."""
        return df[self.feature_columns].values.astype(np.float32)

    def get_rewards(self, df: pd.DataFrame) -> np.ndarray:
        """Extract profit values as the reward signal."""
        return df['Profit'].values.astype(np.float32)

    def get_actions(self, df: pd.DataFrame) -> np.ndarray:
        """Extract the discount bin indices as historical actions."""
        return df['Discount_Bin'].values.astype(np.int64)

    def process(self, filepath: str) -> dict:
        """
        Full pipeline: load -> clean -> engineer -> encode -> extract.
        
        Returns:
            dict with keys: 'states', 'actions', 'rewards', 'dataframe',
                           'feature_columns', 'n_actions', 'state_dim'
        """
        df = self.load_data(filepath)
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

        # Load label encoders
        self.label_encoders = {}
        for col in self.CATEGORICAL_COLS:
            path = directory / f"le_{col.replace(' ', '_')}.pkl"
            if path.exists():
                self.label_encoders[col] = joblib.load(path)

        # Load scaler
        scaler_path = directory / "scaler.pkl"
        if scaler_path.exists():
            self.scaler = joblib.load(scaler_path)

        # Load config
        config_path = directory / "preprocessor_config.json"
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
            self.feature_columns = config['feature_columns']
            self.discount_bins = config['discount_bins']

        self._is_fitted = True
        print(f"[Data] Preprocessor loaded from {directory}")
