"""
Test script to demonstrate the trained RL model's predictions
on random real transactions from your dataset.
"""

import pandas as pd
import numpy as np
import sys
import os

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

from model.data_preprocessor import SalesDataPreprocessor
from model.agent import DQNAgent

def test_model_on_samples():
    print("\nLoading trained model and data...")
    
    # 1. Load the preprocessor
    preprocessor = SalesDataPreprocessor()
    try:
        preprocessor.load_saved('model/saved/best')
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Please ensure the model has finished training.")
        return

    # 2. Load the original dataset
    df = preprocessor.load_data('SALES.xlsx')
    
    # 3. Process the data to get states
    data = preprocessor.process('SALES.xlsx')
    states = data['states']
    
    # 4. Load the trained Agent
    agent = DQNAgent(
        state_dim=data['state_dim'],
        n_actions=data['n_actions'],
        hidden_dims=[128, 128, 64]
    )
    agent.load('model/saved/best')
    
    # 5. Pick 5 random transactions where the original discount was high (>= 20%)
    # This is where the model shines (correcting human mistakes)
    high_discount_mask = df['Discount'] >= 0.2
    sample_indices = df[high_discount_mask].sample(n=5, random_state=42).index
    
    print("\n" + "="*80)
    print(" [AI AGENT vs HUMAN SALESPERSON (Random Samples)]")
    print("="*80)
    
    for idx in sample_indices:
        row = df.loc[idx]
        state = states[idx]
        
        # Get AI Prediction
        action_idx = agent.select_action(state, training=False)
        ai_discount = preprocessor.discount_bins[action_idx]
        
        # Format the output nicely
        print(f"\n[TRANSACTION]: {row['Category']} > {row['Sub-Category']} (Quantity: {row['Quantity']})")
        print(f"   Region: {row['Region']} | Segment: {row['Segment']}")
        print(f"   Sales Value: ${row['Sales']:.2f}")
        
        print("\n   [HUMAN DECISION]:")
        print(f"      Discount Given : {row['Discount']*100:.0f}%")
        
        # Color profit based on positive/negative
        profit = row['Profit']
        profit_str = f"+${profit:.2f}" if profit > 0 else f"-${abs(profit):.2f}"
        print(f"      Actual Profit  : {profit_str}")
        
        print("\n   [AI RECOMMENDATION]:")
        print(f"      Discount Advised: {ai_discount*100:.0f}%")
        if ai_discount < row['Discount']:
            print("      [!] AI recognized the human gave too much discount and lost money.")
        elif ai_discount == row['Discount']:
            print("      [OK] AI agrees with the human.")
        
        print("-" * 80)

if __name__ == "__main__":
    test_model_on_samples()
