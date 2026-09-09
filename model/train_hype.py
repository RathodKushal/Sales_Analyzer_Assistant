import pandas as pd
import numpy as np
import os
import json
import torch
from pathlib import Path
from .agent import DQNAgent
from .hype_environment import ProductHypeEnvironment

def preprocess_hype_data(data_dir: str):
    """
    Groups e-commerce data by Product and Month to create training sequences
    for the Hype RL Agent.
    """
    print("[Data] Loading CSVs...")
    orders = pd.read_csv(f"{data_dir}/orders.csv")
    order_items = pd.read_csv(f"{data_dir}/order_items.csv")
    
    # Merge
    df = pd.merge(order_items, orders[['OrderID', 'OrderDate']], on='OrderID', how='inner')
    df['OrderDate'] = pd.to_datetime(df['OrderDate'])
    df['Month'] = df['OrderDate'].dt.to_period('M')
    
    # Aggregate by Product and Month
    monthly_sales = df.groupby(['StockCode', 'Month']).agg({
        'Quantity': 'sum',
        'UnitPrice': 'mean'
    }).reset_index()
    
    # Create sequences (t-3, t-2, t-1 -> t)
    print("[Data] Creating time-series sequences...")
    all_products = monthly_sales['StockCode'].unique()
    
    sequences = []
    
    for prod in all_products:
        prod_data = monthly_sales[monthly_sales['StockCode'] == prod].sort_values('Month')
        
        # Need at least 4 months to form a single target + 3 history
        if len(prod_data) < 4:
            continue
            
        quantities = prod_data['Quantity'].values
        prices = prod_data['UnitPrice'].values
        months = [m.month for m in prod_data['Month'].values]
        
        for i in range(3, len(prod_data)):
            # History
            q_t3 = quantities[i-3]
            q_t2 = quantities[i-2]
            q_t1 = quantities[i-1]
            q_t = quantities[i] # Target
            
            # Prevent zero division
            if q_t1 == 0:
                q_t1 = 1
                
            growth = (q_t - q_t1) / q_t1
            
            # State vector (normalized roughly)
            # Sales history is normalized by dividing by max observed or simple scaling
            # We will use log scale for quantities to handle wide variance
            def log_scale(x):
                return np.log1p(max(0, x)) / 10.0 # scale down
                
            state = [
                log_scale(q_t3),
                log_scale(q_t2),
                log_scale(q_t1),
                months[i] / 12.0, # Seasonality
                np.log1p(prices[i]) / 10.0 # Price
            ]
            
            sequences.append({
                'state': state,
                'actual_growth': growth,
                'stock_code': prod,
                'target_month': str(prod_data['Month'].values[i]),
                'quantity_t': q_t
            })
            
    print(f"[Data] Created {len(sequences)} hype training sequences.")
    return sequences

def train_hype():
    data_dir = 'data'
    model_dir = 'model/saved_hype'
    os.makedirs(model_dir, exist_ok=True)
    
    sequences = preprocess_hype_data(data_dir)
    import random
    if len(sequences) > 1000:
        sequences = random.sample(sequences, 1000)
    
    env = ProductHypeEnvironment(sequences)
    
    # Initialize DQN
    agent = DQNAgent(
        state_dim=env.state_dim,
        n_actions=env.n_actions,
        lr=1e-3,
        gamma=0.9,
        epsilon_start=1.0,
        epsilon_end=0.01,
        epsilon_decay=0.8, # Fast decay since few sequences
        batch_size=32,
        buffer_capacity=10000
    )
    
    episodes = 2
    best_reward = -float('inf')
    
    for ep in range(episodes):
        state = env.reset()
        done = False
        total_reward = 0
        total_loss = 0
        steps = 0
        
        while not done:
            action = agent.select_action(state)
            next_state, reward, done, _ = env.step(action)
            
            agent.store_experience(state, action, reward, next_state, done)
            loss = agent.train_step()
            if loss is not None:
                total_loss += loss
                
            state = next_state
            total_reward += reward
            steps += 1
            
            if steps % 1000 == 0:
                print(f"  Step {steps}/5000...")
            
        agent.decay_epsilon()
        agent.scheduler.step()
        
        avg_loss = total_loss / max(1, steps)
        print(f"Episode {ep+1:02d}/{episodes} | Reward: {total_reward:8.2f} | Loss: {avg_loss:.4f} | Epsilon: {agent.epsilon:.3f}")
        
        if total_reward > best_reward:
            best_reward = total_reward
            agent.save(os.path.join(model_dir, 'best'))
            
    agent.save(os.path.join(model_dir, 'final'))
    print("Training complete!")

if __name__ == '__main__':
    train_hype()
