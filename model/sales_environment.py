"""
Sales Environment for Reinforcement Learning
==============================================
A custom OpenAI Gym-style environment that simulates the sales discount 
optimization problem. The agent observes a sale's context (product category,
segment, region, quantity, etc.) and chooses a discount level to maximize profit.

The environment uses historical data to learn how different discount levels
affect profit across different product-segment-region combinations.
"""

import numpy as np
from collections import defaultdict


class SalesEnvironment:
    """
    Gym-style environment for the sales discount optimization problem.
    
    The agent steps through historical sales records. At each step:
      - It observes the state (features of the current transaction)
      - It selects an action (a discount level from the discrete bins)
      - It receives a reward based on the estimated profit for that action
    
    The environment builds an internal profit model from historical data,
    so it can estimate the reward for actions that differ from what
    historically happened.
    
    Attributes:
        states: np.ndarray of shape (N, state_dim) — state feature vectors
        actions: np.ndarray of shape (N,) — historical action indices
        rewards: np.ndarray of shape (N,) — historical profit values
        n_actions: int — number of discrete discount bins
        state_dim: int — dimensionality of the state vector
    """

    def __init__(self, states, actions, rewards, n_actions, discount_bins=None):
        """
        Args:
            states: (N, state_dim) array of state features
            actions: (N,) array of action indices taken historically
            rewards: (N,) array of profit values (rewards)
            n_actions: number of discrete actions available
            discount_bins: list of discount values corresponding to action indices
        """
        self.states = states
        self.actions = actions
        self.rewards = rewards
        self.n_actions = n_actions
        self.state_dim = states.shape[1]
        self.discount_bins = discount_bins or [0.0, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5]
        
        self.n_samples = len(states)
        self.current_idx = 0
        self.done = False
        
        # Build the profit model for counterfactual reward estimation
        self._build_profit_model()
        
        # Normalize rewards for more stable RL training
        self._reward_mean = rewards.mean()
        self._reward_std = max(rewards.std(), 1e-6)

    def _build_profit_model(self):
        """
        Build an internal model that estimates profit for any (state, action) pair.
        
        Uses a bucketed approach:
          - Discretize state features into bins to create state 'keys'
          - For each (state_key, action) pair, store average historical profit
          - For unseen pairs, use the global average for that action
        
        This allows counterfactual reasoning: "What would the profit have been
        if we had applied a different discount?"
        """
        # Global profit per action (fallback)
        self._action_profit = defaultdict(list)
        # State-specific profit per action
        self._state_action_profit = defaultdict(list)
        
        # Create coarse state keys by binning the first few state dimensions
        for i in range(self.n_samples):
            state_key = self._state_to_key(self.states[i])
            action = self.actions[i]
            profit = self.rewards[i]
            
            self._action_profit[action].append(profit)
            self._state_action_profit[(state_key, action)].append(profit)
        
        # Compute means
        self._action_profit_mean = {}
        for a, profits in self._action_profit.items():
            self._action_profit_mean[a] = np.mean(profits)
        
        self._state_action_profit_mean = {}
        for key, profits in self._state_action_profit.items():
            self._state_action_profit_mean[key] = np.mean(profits)

        # Global fallback
        self._global_mean_profit = np.mean(self.rewards)

    def _state_to_key(self, state: np.ndarray) -> tuple:
        """Convert a continuous state vector to a discrete key by coarse binning."""
        # Use the first 5 encoded categorical features directly (they're integers)
        # and bin the continuous features into 5 buckets
        key_parts = []
        for i, val in enumerate(state):
            if i < 5:
                # Categorical encoded features — use directly
                key_parts.append(int(round(val)))
            else:
                # Continuous features — bin into 5 levels
                key_parts.append(int(np.clip(np.digitize(val, [-1, -0.5, 0, 0.5, 1]), 0, 5)))
        return tuple(key_parts)

    def reset(self, shuffle: bool = True) -> np.ndarray:
        """
        Reset the environment to the beginning.
        
        Args:
            shuffle: If True, randomize the order of records for training variety.
        
        Returns:
            The initial state observation.
        """
        if shuffle:
            self._indices = np.random.permutation(self.n_samples)
        else:
            self._indices = np.arange(self.n_samples)
        
        self.current_idx = 0
        self.done = False
        self._episode_rewards = []
        
        return self.states[self._indices[self.current_idx]]

    def step(self, action: int) -> tuple:
        """
        Take an action (apply a discount level) and observe the result.
        
        Args:
            action: index into the discount bins
        
        Returns:
            (next_state, reward, done, info)
        """
        idx = self._indices[self.current_idx]
        state = self.states[idx]
        
        # Get the reward for this (state, action) pair
        reward = self._estimate_reward(state, action, idx)
        
        # Normalize reward for stable training
        normalized_reward = (reward - self._reward_mean) / self._reward_std
        
        # Move to the next record
        self.current_idx += 1
        self.done = self.current_idx >= self.n_samples
        
        if not self.done:
            next_state = self.states[self._indices[self.current_idx]]
        else:
            next_state = state  # Terminal state
        
        info = {
            'raw_reward': reward,
            'actual_action': self.actions[idx],
            'actual_reward': self.rewards[idx],
            'discount_applied': self.discount_bins[action],
        }
        
        self._episode_rewards.append(reward)
        
        return next_state, normalized_reward, self.done, info

    def _estimate_reward(self, state: np.ndarray, action: int, idx: int) -> float:
        """
        Estimate the profit (reward) for a given state-action pair.
        
        Strategy:
          1. If the agent chose the same action as historical, return actual profit
          2. If different, use the state-action profit model
          3. Fallback to global action profit model
          
        Additionally applies a scaling factor based on the relationship between
        the chosen discount and the historical discount to account for the
        cost-volume tradeoff.
        """
        historical_action = self.actions[idx]
        historical_profit = self.rewards[idx]
        
        if action == historical_action:
            return historical_profit
        
        # Counterfactual: estimate what profit would be with a different discount
        state_key = self._state_to_key(state)
        
        # Try state-specific estimate first
        key = (state_key, action)
        if key in self._state_action_profit_mean:
            base_estimate = self._state_action_profit_mean[key]
        elif action in self._action_profit_mean:
            base_estimate = self._action_profit_mean[action]
        else:
            base_estimate = self._global_mean_profit
        
        # Apply a scaling factor: if we know the profit for the historical action
        # in this exact state, use the ratio to adjust
        hist_key = (state_key, historical_action)
        if hist_key in self._state_action_profit_mean:
            hist_estimate = self._state_action_profit_mean[hist_key]
            if abs(hist_estimate) > 1e-6:
                # Scale the estimate by how this specific transaction differs
                # from the average for this state-action
                scale = historical_profit / hist_estimate
                base_estimate *= scale
        
        return base_estimate

    def get_episode_stats(self) -> dict:
        """Get statistics for the current episode."""
        if not self._episode_rewards:
            return {}
        rewards = np.array(self._episode_rewards)
        return {
            'total_reward': rewards.sum(),
            'mean_reward': rewards.mean(),
            'std_reward': rewards.std(),
            'min_reward': rewards.min(),
            'max_reward': rewards.max(),
            'positive_pct': (rewards > 0).mean() * 100,
        }

    def sample_batch(self, batch_size: int) -> tuple:
        """
        Sample a random batch of (state, action, reward, next_state, done) tuples.
        Used for experience replay in the DQN agent.
        """
        indices = np.random.randint(0, self.n_samples, size=batch_size)
        
        states = self.states[indices]
        actions = self.actions[indices]
        rewards_raw = self.rewards[indices]
        
        # Normalize rewards
        rewards_norm = (rewards_raw - self._reward_mean) / self._reward_std
        
        # Next states (shifted by 1, with wraparound)
        next_indices = np.minimum(indices + 1, self.n_samples - 1)
        next_states = self.states[next_indices]
        
        # Done flags
        dones = (indices >= self.n_samples - 1).astype(np.float32)
        
        return states, actions, rewards_norm, next_states, dones
