import numpy as np

class ProductHypeEnvironment:
    """
    RL Environment for Product Demand/Hype Prediction.
    
    State:
        - month_t_minus_3_sales (normalized)
        - month_t_minus_2_sales (normalized)
        - month_t_minus_1_sales (normalized)
        - target_month (1-12, normalized)
        - avg_price (normalized)
        
    Action Space:
        5 Discrete Bins representing "Predicted Hype Level"
        0: Severe Drop (<-20% growth)
        1: Slight Drop (-20% to -5%)
        2: Steady (-5% to +5%)
        3: Growing (+5% to +20%)
        4: Viral/Hype (>+20% growth)
        
    Reward:
        Positive if the predicted hype matches the actual hype.
        Negative penalty if it misclassifies.
    """
    
    def __init__(self, data, max_steps=None):
        """
        data: list of dicts with:
          state: [t-3, t-2, t-1, month, price]
          actual_growth: float (percentage growth from t-1 to t)
        """
        self.data = data
        self.max_steps = max_steps if max_steps else len(self.data)
        self.current_step = 0
        
        # State dimension is 5
        self.state_dim = 5
        self.n_actions = 5
        
        # Define the bins for growth
        self.growth_bins = [
            (-float('inf'), -0.20),
            (-0.20, -0.05),
            (-0.05, 0.05),
            (0.05, 0.20),
            (0.20, float('inf'))
        ]
        
    def reset(self):
        self.current_step = 0
        if len(self.data) == 0:
            return np.zeros(self.state_dim)
        return np.array(self.data[self.current_step]['state'], dtype=np.float32)
        
    def step(self, action):
        if self.current_step >= len(self.data):
            # Should not happen if loop limits to max_steps
            return np.zeros(self.state_dim), 0.0, True, {}
            
        record = self.data[self.current_step]
        actual_growth = record['actual_growth']
        
        # Determine actual hype bin
        actual_bin = 2 # Default steady
        for i, (low, high) in enumerate(self.growth_bins):
            if low <= actual_growth < high:
                actual_bin = i
                break
                
        # Calculate reward
        if action == actual_bin:
            reward = 1.0 # Perfect prediction
        elif abs(action - actual_bin) == 1:
            reward = 0.2 # Close
        else:
            reward = -1.0 * abs(action - actual_bin) # Penalty for being far off
            
        self.current_step += 1
        done = self.current_step >= self.max_steps
        
        if not done:
            next_state = np.array(self.data[self.current_step]['state'], dtype=np.float32)
        else:
            next_state = np.zeros(self.state_dim, dtype=np.float32)
            
        return next_state, reward, done, {'actual_bin': actual_bin, 'predicted_bin': action, 'growth': actual_growth}
