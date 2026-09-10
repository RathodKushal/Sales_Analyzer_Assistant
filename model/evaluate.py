"""
Evaluation Script for E-Commerce Pricing Agent
==============================================
Loads the trained Dueling DQN agent and evaluates its pricing strategy
against the dataset, generating profitability metrics across different
Indian states, customer segments, and product categories.
"""

import os
import argparse
import pandas as pd
import numpy as np
import json
import torch
import matplotlib.pyplot as plt
from pathlib import Path

from .data_preprocessor import EcommerceDataPreprocessor
from .ecommerce_environment import EcommerceEnvironment
from .agent import DQNAgent


def evaluate(data_dir: str, model_dir: str):
    """
    Evaluate the trained agent on the dataset and generate insights.
    """
    print("=" * 60)
    print("  E-COMMERCE MODEL EVALUATION")
    print("=" * 60)
    
    # 1. Load Data
    print(f"\n[1/4] Loading Data and Preprocessor from {model_dir}...")
    preprocessor = EcommerceDataPreprocessor()
    
    try:
        preprocessor.load_saved(model_dir)
    except Exception as e:
        print(f"Warning: Could not load saved preprocessor: {e}. Will fit a new one.")
        
    data_dict = preprocessor.process(data_dir)
    env = EcommerceEnvironment(data_dict)
    
    # 2. Load Agent
    print(f"\n[2/4] Loading trained agent from {model_dir}/best...")
    agent = DQNAgent(
        state_dim=env.state_dim,
        n_actions=env.n_actions,
        hidden_dims=(256, 128)
    )
    
    try:
        agent.load(os.path.join(model_dir, 'best'))
    except FileNotFoundError:
        print(f"Error: Could not find model checkpoint at {model_dir}/best")
        return
        
    # Disable exploration during evaluation
    agent.epsilon = 0.0
    
    # 3. Run Evaluation
    print(f"\n[3/4] Running inference on {env.max_steps} transactions...")
    
    state = env.reset()
    results = []
    
    # We don't use the environment step function because we want to record all outputs
    # without running a real RL episode (we just do batch inference effectively)
    eval_steps = min(5000, env.max_steps)
    for i in range(eval_steps):
        # RL Action Selection with Business Rule (Action Masking)
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        with torch.no_grad():
            action_values = agent.q_network(state_tensor)
            
            # Business Rule: Do not allow discounts that result in negative margins
            # base_margin is feature index 3 (BaseMargin)
            base_margin = state[3]
            # discount bins are [0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]
            for a, max_disc in enumerate([0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]):
                if max_disc >= base_margin:
                    action_values[0][a] = -float('inf') # Mask out unprofitable actions
                    
            if action_values.max() == -float('inf'):
                action = 0 # Fallback to 0 discount
            else:
                action = action_values.max(1)[1].view(1, 1).item()
            
        discount_pred = env.discount_bins[action]
        
        # Get actual historical values
        historical_discount = data_dict['dataframe'].iloc[i]['Discount'] if 'Discount' in data_dict['dataframe'].columns else 0.0
        profit = data_dict['dataframe'].iloc[i]['Profit'] if 'Profit' in data_dict['dataframe'].columns else 0.0
        
        # Estimate new profit (counterfactual)
        amount_col = 'TotalAmount' if 'TotalAmount' in data_dict['dataframe'].columns else 'TotalAmount_x'
        base_amount = data_dict['dataframe'].iloc[i][amount_col]
        base_margin = np.random.uniform(0.08, 0.25) # Re-simulate base margin
        
        # Simple counterfactual: did the agent find a better discount than historical?
        predicted_margin = base_margin - discount_pred
        historical_margin = base_margin - historical_discount
        
        elasticity_pred = 1.0 + (discount_pred * 1.5)
        elasticity_hist = 1.0 + (historical_discount * 1.5)
        
        profit_pred = base_amount * predicted_margin * elasticity_pred
        profit_hist = base_amount * historical_margin * elasticity_hist
        
        results.append({
            'TransactionID': i,
            'State': data_dict['dataframe'].iloc[i].get('State', 'Unknown'),
            'Category': data_dict['dataframe'].iloc[i].get('Category', 'Unknown'),
            'CustomerSegment': data_dict['dataframe'].iloc[i].get('CustomerSegment', 'Unknown'),
            'PaymentMethod': data_dict['dataframe'].iloc[i].get('PaymentMethod', 'Unknown'),
            'TotalAmount': base_amount,
            'HistoricalDiscount': historical_discount,
            'PredictedDiscount': discount_pred,
            'HistoricalProfit': profit_hist,
            'PredictedProfit': profit_pred,
            'ProfitLift': profit_pred - profit_hist
        })
        
        # Advance state
        if i + 1 < env.max_steps:
            state = env.states[i + 1]
            
        if (i + 1) % 5000 == 0:
            print(f"  Processed {i+1}/{env.max_steps} transactions...")
            
    results_df = pd.DataFrame(results)
    
    # 4. Generate Analytics
    print("\n[4/4] Generating E-Commerce Analytics...")
    
    # Overall metrics
    total_hist_profit = results_df['HistoricalProfit'].sum()
    total_pred_profit = results_df['PredictedProfit'].sum()
    profit_lift_pct = ((total_pred_profit - total_hist_profit) / abs(total_hist_profit)) * 100 if total_hist_profit != 0 else 0
    
    avg_hist_discount = results_df['HistoricalDiscount'].mean() * 100
    avg_pred_discount = results_df['PredictedDiscount'].mean() * 100
    
    print("\n--- OVERALL PERFORMANCE ---")
    print(f"Total Historical Profit: Rs. {total_hist_profit:,.2f}")
    print(f"Total Predicted Profit:  Rs. {total_pred_profit:,.2f}")
    print(f"Profit Lift:             {profit_lift_pct:+.2f}%")
    print(f"Avg Historical Discount: {avg_hist_discount:.1f}%")
    print(f"Avg Predicted Discount:  {avg_pred_discount:.1f}%")
    
    # Analysis by Customer Segment
    print("\n--- BY CUSTOMER SEGMENT ---")
    segment_analysis = results_df.groupby('CustomerSegment').agg(
        Count=('TransactionID', 'count'),
        AvgPredDiscount=('PredictedDiscount', lambda x: x.mean() * 100),
        ProfitLift=('ProfitLift', 'sum')
    ).round(2)
    print(segment_analysis)
    
    # Analysis by Indian State
    print("\n--- BY INDIAN STATE (Top 5) ---")
    state_analysis = results_df.groupby('State').agg(
        ProfitLift=('ProfitLift', 'sum'),
        AvgDiscount=('PredictedDiscount', lambda x: x.mean() * 100)
    ).sort_values('ProfitLift', ascending=False).head(5).round(2)
    print(state_analysis)
    
    # Analysis by Payment Method
    print("\n--- BY PAYMENT METHOD ---")
    payment_analysis = results_df.groupby('PaymentMethod').agg(
        AvgDiscount=('PredictedDiscount', lambda x: x.mean() * 100)
    ).round(2)
    print(payment_analysis)
    
    # Save results
    metrics = {
        'overall': {
            'profit_lift_percentage': float(profit_lift_pct),
            'total_profit_predicted': float(total_pred_profit),
            'avg_discount_predicted': float(avg_pred_discount)
        },
        'by_segment': segment_analysis.to_dict(orient='index'),
        'by_state_top5': state_analysis.to_dict(orient='index'),
        'by_payment': payment_analysis.to_dict(orient='index')
    }
    
    out_file = os.path.join(model_dir, 'evaluation_results.json')
    with open(out_file, 'w') as f:
        json.dump(metrics, f, indent=2)
        
    print(f"\nEvaluation metrics saved to: {out_file}")
    
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate E-Commerce Pricing Agent")
    parser.add_argument('--data_dir', type=str, default='data',
                        help='Directory containing the Indian e-commerce CSVs')
    parser.add_argument('--model_dir', type=str, default='model/saved',
                        help='Directory containing the trained model')
                        
    args = parser.parse_args()
    
    evaluate(data_dir=args.data_dir, model_dir=args.model_dir)
