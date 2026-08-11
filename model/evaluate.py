"""
Model Evaluation & Metrics for Sales RL Model
================================================
Evaluates the trained DQN agent's performance and produces:
  - Accuracy metrics (reward improvement, optimal action %)
  - Per-category analysis
  - Discount distribution comparison (agent vs historical)
  - Profit improvement breakdown
  - Visualization plots
"""

import numpy as np
import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime

from model.data_preprocessor import SalesDataPreprocessor
from model.sales_environment import SalesEnvironment
from model.agent import DQNAgent


class ModelEvaluator:
    """
    Comprehensive evaluation of the trained RL agent.
    
    Compares the agent's discount policy against historical decisions
    and computes improvement metrics.
    """

    def __init__(self, agent: DQNAgent, preprocessor: SalesDataPreprocessor):
        self.agent = agent
        self.preprocessor = preprocessor
        self.results = {}

    def evaluate_full(self, data: dict, df=None) -> dict:
        """
        Run complete evaluation on a dataset.
        
        Args:
            data: dict with 'states', 'actions', 'rewards' from preprocessor
            df: Optional original DataFrame for per-category analysis
        
        Returns:
            dict of evaluation metrics
        """
        print("\n" + "=" * 60)
        print("  MODEL EVALUATION")
        print("=" * 60)
        
        states = data['states']
        historical_actions = data['actions']
        historical_rewards = data['rewards']
        n_samples = len(states)
        
        # --- Agent's Predictions ---
        agent_actions = []
        agent_q_values = []
        
        for i in range(n_samples):
            action = self.agent.select_action(states[i], training=False)
            q_vals = self.agent.get_q_values(states[i])
            agent_actions.append(action)
            agent_q_values.append(q_vals)
        
        agent_actions = np.array(agent_actions)
        agent_q_values = np.array(agent_q_values)
        
        # --- Core Metrics ---
        metrics = {}
        
        # 1. Action Agreement Rate
        agreement = (agent_actions == historical_actions).mean() * 100
        metrics['action_agreement_rate'] = agreement
        
        # 2. Discount Distribution
        discount_bins = self.preprocessor.discount_bins
        hist_dist = np.bincount(historical_actions, minlength=len(discount_bins))
        agent_dist = np.bincount(agent_actions, minlength=len(discount_bins))
        
        metrics['historical_discount_distribution'] = {
            str(discount_bins[i]): int(hist_dist[i]) for i in range(len(discount_bins))
        }
        metrics['agent_discount_distribution'] = {
            str(discount_bins[i]): int(agent_dist[i]) for i in range(len(discount_bins))
        }
        
        # 3. Estimated Profit Improvement
        # For records where the agent chose differently, estimate the profit change
        env = SalesEnvironment(
            states=states,
            actions=historical_actions,
            rewards=historical_rewards,
            n_actions=len(discount_bins),
            discount_bins=discount_bins,
        )
        
        agent_estimated_rewards = []
        for i in range(n_samples):
            reward = env._estimate_reward(states[i], agent_actions[i], i)
            agent_estimated_rewards.append(reward)
        agent_estimated_rewards = np.array(agent_estimated_rewards)
        
        total_historical_profit = historical_rewards.sum()
        total_agent_profit = agent_estimated_rewards.sum()
        profit_improvement = total_agent_profit - total_historical_profit
        profit_improvement_pct = (profit_improvement / abs(total_historical_profit)) * 100
        
        metrics['total_historical_profit'] = float(total_historical_profit)
        metrics['total_agent_estimated_profit'] = float(total_agent_profit)
        metrics['profit_improvement'] = float(profit_improvement)
        metrics['profit_improvement_pct'] = float(profit_improvement_pct)
        
        # 4. Mean reward per action (agent vs historical)
        metrics['mean_historical_reward'] = float(historical_rewards.mean())
        metrics['mean_agent_estimated_reward'] = float(agent_estimated_rewards.mean())
        
        # 5. Positive Profit Rate
        hist_positive_pct = (historical_rewards > 0).mean() * 100
        agent_positive_pct = (agent_estimated_rewards > 0).mean() * 100
        metrics['historical_positive_profit_rate'] = float(hist_positive_pct)
        metrics['agent_positive_profit_rate'] = float(agent_positive_pct)
        
        # 6. Q-Value Statistics
        metrics['mean_q_value'] = float(agent_q_values.mean())
        metrics['std_q_value'] = float(agent_q_values.std())
        metrics['q_value_spread'] = float(
            (agent_q_values.max(axis=1) - agent_q_values.min(axis=1)).mean()
        )
        
        # --- Per-Category Analysis ---
        if df is not None:
            metrics['per_category'] = self._per_category_analysis(
                df, agent_actions, agent_estimated_rewards, historical_rewards
            )
        
        # --- Print Summary ---
        self._print_summary(metrics)
        
        self.results = metrics
        return metrics

    def _per_category_analysis(self, df, agent_actions, agent_rewards, hist_rewards):
        """Analyze performance breakdown by product category."""
        categories = df['Category'].values
        unique_cats = np.unique(categories)
        
        per_cat = {}
        for cat in unique_cats:
            mask = categories == cat
            n = mask.sum()
            
            per_cat[cat] = {
                'count': int(n),
                'historical_mean_profit': float(hist_rewards[mask].mean()),
                'agent_mean_profit': float(agent_rewards[mask].mean()),
                'improvement': float(agent_rewards[mask].mean() - hist_rewards[mask].mean()),
                'most_chosen_discount': float(
                    self.preprocessor.discount_bins[
                        np.bincount(agent_actions[mask], 
                                   minlength=len(self.preprocessor.discount_bins)).argmax()
                    ]
                ),
            }
        
        return per_cat

    def _print_summary(self, metrics: dict):
        """Print a formatted evaluation summary."""
        print(f"\n  {'Metric':<40} {'Value':>15}")
        print(f"  {'-'*55}")
        print(f"  {'Action Agreement Rate':<40} {metrics['action_agreement_rate']:>14.1f}%")
        print(f"  {'Historical Positive Profit Rate':<40} {metrics['historical_positive_profit_rate']:>14.1f}%")
        print(f"  {'Agent Positive Profit Rate':<40} {metrics['agent_positive_profit_rate']:>14.1f}%")
        print(f"  {'Mean Historical Reward':<40} {metrics['mean_historical_reward']:>15.2f}")
        print(f"  {'Mean Agent Estimated Reward':<40} {metrics['mean_agent_estimated_reward']:>15.2f}")
        print(f"  {'Total Historical Profit':<40} {metrics['total_historical_profit']:>15.2f}")
        print(f"  {'Total Agent Estimated Profit':<40} {metrics['total_agent_estimated_profit']:>15.2f}")
        print(f"  {'Profit Improvement':<40} {metrics['profit_improvement']:>15.2f}")
        print(f"  {'Profit Improvement %':<40} {metrics['profit_improvement_pct']:>14.1f}%")
        
        print(f"\n  {'Q-Value Statistics':}")
        print(f"  {'Mean Q-Value':<40} {metrics['mean_q_value']:>15.4f}")
        print(f"  {'Std Q-Value':<40} {metrics['std_q_value']:>15.4f}")
        print(f"  {'Mean Q-Value Spread':<40} {metrics['q_value_spread']:>15.4f}")
        
        print(f"\n  Discount Distribution Comparison:")
        print(f"  {'Discount':<12} {'Historical':>12} {'Agent':>12}")
        print(f"  {'-'*36}")
        for discount in self.preprocessor.discount_bins:
            key = str(discount)
            hist = metrics['historical_discount_distribution'].get(key, 0)
            agent = metrics['agent_discount_distribution'].get(key, 0)
            print(f"  {discount:<12.2f} {hist:>12} {agent:>12}")
        
        if 'per_category' in metrics:
            print(f"\n  Per-Category Breakdown:")
            print(f"  {'Category':<20} {'Hist Profit':>12} {'Agent Profit':>13} {'Improvement':>12}")
            print(f"  {'-'*57}")
            for cat, vals in metrics['per_category'].items():
                print(f"  {cat:<20} {vals['historical_mean_profit']:>12.2f} "
                      f"{vals['agent_mean_profit']:>13.2f} "
                      f"{vals['improvement']:>12.2f}")
        
        print("=" * 60)

    def save_results(self, filepath: str):
        """Save evaluation results to JSON."""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert numpy types to native Python for JSON serialization
        def convert(obj):
            if isinstance(obj, (np.integer,)):
                return int(obj)
            elif isinstance(obj, (np.floating,)):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            return obj
        
        serializable = json.loads(
            json.dumps(self.results, default=convert)
        )
        
        with open(filepath, 'w') as f:
            json.dump(serializable, f, indent=2)
        
        print(f"[Eval] Results saved to {filepath}")


def generate_training_plots(results: dict, save_dir: str):
    """
    Generate training visualization plots using matplotlib.
    
    Creates:
      - Training reward curve
      - Loss curve
      - Epsilon decay curve
      - Validation reward curve
    """
    try:
        import matplotlib
        matplotlib.use('Agg')  # Non-interactive backend
        import matplotlib.pyplot as plt
    except ImportError:
        print("[Eval] matplotlib not installed. Skipping plots.")
        return
    
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)
    
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Sales RL Model — Training Metrics', fontsize=16, fontweight='bold')
    
    # 1. Training Reward
    if 'episode_rewards' in results:
        ax = axes[0, 0]
        rewards = results['episode_rewards']
        ax.plot(rewards, alpha=0.3, color='#4F46E5', linewidth=0.5)
        # Smoothed curve (moving average)
        window = min(20, len(rewards) // 5)
        if window > 1:
            smoothed = np.convolve(rewards, np.ones(window)/window, mode='valid')
            ax.plot(range(window-1, len(rewards)), smoothed, color='#4F46E5', linewidth=2)
        ax.set_title('Training Reward (Mean Profit per Step)')
        ax.set_xlabel('Episode')
        ax.set_ylabel('Mean Reward')
        ax.grid(True, alpha=0.3)
    
    # 2. Training Loss
    if 'episode_losses' in results:
        ax = axes[0, 1]
        losses = results['episode_losses']
        ax.plot(losses, alpha=0.3, color='#DC2626', linewidth=0.5)
        window = min(20, len(losses) // 5)
        if window > 1:
            smoothed = np.convolve(losses, np.ones(window)/window, mode='valid')
            ax.plot(range(window-1, len(losses)), smoothed, color='#DC2626', linewidth=2)
        ax.set_title('Training Loss (Smooth L1)')
        ax.set_xlabel('Episode')
        ax.set_ylabel('Loss')
        ax.grid(True, alpha=0.3)
    
    # 3. Validation Reward
    if 'val_rewards' in results:
        ax = axes[1, 0]
        val_rewards = results['val_rewards']
        ax.plot(val_rewards, 'o-', color='#059669', linewidth=2, markersize=4)
        ax.set_title('Validation Reward')
        ax.set_xlabel('Evaluation Point')
        ax.set_ylabel('Mean Reward')
        ax.grid(True, alpha=0.3)
    
    # 4. Epsilon Decay
    ax = axes[1, 1]
    if 'episode_rewards' in results:
        # Reconstruct epsilon decay
        eps = 1.0
        epsilons = []
        for _ in range(len(results['episode_rewards'])):
            epsilons.append(eps)
            eps = max(0.01, eps * 0.995)
        ax.plot(epsilons, color='#D97706', linewidth=2)
        ax.set_title('Exploration Rate (Epsilon)')
        ax.set_xlabel('Episode')
        ax.set_ylabel('Epsilon')
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plot_path = save_dir / 'training_metrics.png'
    plt.savefig(plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"[Eval] Training plots saved to {plot_path}")


# ============================================================
# Entry point for standalone evaluation
# ============================================================
if __name__ == '__main__':
    from model.train import TrainingConfig
    
    config = TrainingConfig(data_path='SALES.xlsx', save_dir='model/saved')
    
    # Load preprocessor
    preprocessor = SalesDataPreprocessor()
    preprocessor.load_saved('model/saved/best')
    
    # Process data
    data = preprocessor.process(config.data_path)
    
    # Load agent
    agent = DQNAgent(
        state_dim=data['state_dim'],
        n_actions=data['n_actions'],
    )
    agent.load('model/saved/best')
    
    # Evaluate
    evaluator = ModelEvaluator(agent, preprocessor)
    metrics = evaluator.evaluate_full(data, df=data['dataframe'])
    evaluator.save_results('model/saved/evaluation_results.json')
