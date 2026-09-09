import pandas as pd
import numpy as np
import os
import json
import torch
from .agent import DQNAgent
from .hype_environment import ProductHypeEnvironment
from .train_hype import preprocess_hype_data

def evaluate_hype():
    data_dir = 'data'
    model_dir = 'model/saved_hype'
    
    sequences = preprocess_hype_data(data_dir)
    env = ProductHypeEnvironment(sequences)
    
    agent = DQNAgent(
        state_dim=env.state_dim,
        n_actions=env.n_actions,
        epsilon_start=0.0,
        epsilon_end=0.0
    )
    
    try:
        agent.load(os.path.join(model_dir, 'best'))
    except FileNotFoundError:
        print("Model not found")
        return
        
    agent.epsilon = 0.0 # Greedy
    
    print("[Eval] Running inference...")
    
    predictions = {}
    
    # We will just evaluate the last sequence for each product to predict its *next* state
    # Actually, let's just evaluate all sequences and see accuracy
    correct = 0
    total = 0
    
    product_predictions = {}
    
    for seq in sequences:
        state = np.array(seq['state'], dtype=np.float32)
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        
        with torch.no_grad():
            action_values = agent.q_network(state_tensor)
            pred_bin = action_values.max(1)[1].item()
            
        actual_growth = seq['actual_growth']
        actual_bin = 2
        for i, (low, high) in enumerate(env.growth_bins):
            if low <= actual_growth < high:
                actual_bin = i
                break
                
        if pred_bin == actual_bin:
            correct += 1
        elif abs(pred_bin - actual_bin) == 1:
            correct += 0.5 # Partial credit
            
        total += 1
        
        # Save the latest prediction for the product
        prod = seq['stock_code']
        # Overwrite so we keep the latest month's prediction
        product_predictions[prod] = {
            'predicted_bin': pred_bin,
            'actual_bin': actual_bin,
            'actual_growth': float(actual_growth),
            'target_month': seq['target_month'],
            'historical_sales': [
                int(max(0, np.expm1(seq['state'][0] * 10))),
                int(max(0, np.expm1(seq['state'][1] * 10))),
                int(max(0, np.expm1(seq['state'][2] * 10))),
                int(seq['quantity_t'])
            ]
        }
        
    accuracy = correct / total if total > 0 else 0
    print(f"Hype Prediction Accuracy: {accuracy * 100:.2f}%")
    
    with open(os.path.join(model_dir, 'hype_evaluation_results.json'), 'w') as f:
        json.dump({
            'accuracy': accuracy,
            'total_evaluated': total,
            'product_predictions': product_predictions
        }, f, indent=4)
        
    print("Evaluation saved to hype_evaluation_results.json")

if __name__ == '__main__':
    evaluate_hype()
