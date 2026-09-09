"""
Training Pipeline for E-Commerce Pricing Optimization
=====================================================
Trains the Dueling DQN agent on the Indian e-commerce dataset to learn
optimal discount strategies.

Features:
- Handles multi-CSV data loading via EcommerceDataPreprocessor
- Environment evaluation during training
- Checkpoint saving
"""

import os
import argparse
import time
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

from .data_preprocessor import EcommerceDataPreprocessor
from .ecommerce_environment import EcommerceEnvironment
from .agent import DQNAgent

# Ensure reproducible training if needed
import torch
torch.manual_seed(42)
np.random.seed(42)

def plot_metrics(rewards, losses, save_dir):
    """Plot and save training metrics."""
    plt.figure(figsize=(12, 5))
    
    # Plot smoothed rewards
    plt.subplot(1, 2, 1)
    if len(rewards) > 0:
        window = min(len(rewards) // 10 + 1, 100)
        smoothed_rewards = np.convolve(rewards, np.ones(window)/window, mode='valid')
        plt.plot(rewards, alpha=0.3, color='blue', label='Raw')
        plt.plot(smoothed_rewards, color='darkblue', label=f'Moving Avg ({window})')
    plt.title('Episode Rewards')
    plt.xlabel('Episode')
    plt.ylabel('Total Reward')
    plt.legend()
    
    # Plot smoothed losses
    plt.subplot(1, 2, 2)
    if len(losses) > 0:
        window = min(len(losses) // 10 + 1, 100)
        smoothed_losses = np.convolve(losses, np.ones(window)/window, mode='valid')
        plt.plot(losses, alpha=0.3, color='red', label='Raw')
        plt.plot(smoothed_losses, color='darkred', label=f'Moving Avg ({window})')
    plt.title('Training Loss')
    plt.xlabel('Episode')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, 'training_metrics.png'))
    plt.close()


def train(data_dir: str, save_dir: str, episodes: int = 1000, 
          batch_size: int = 64, max_steps: int = 1000):
    """
    Train the RL agent on the e-commerce dataset.
    """
    print("=" * 60)
    print("  E-COMMERCE PRICING OPTIMIZATION TRAINING")
    print("=" * 60)
    
    # 1. Prepare Data
    print(f"\n[1/4] Preparing Data from {data_dir}...")
    preprocessor = EcommerceDataPreprocessor()
    data_dict = preprocessor.process(data_dir)
    
    # Save the fitted preprocessor for inference
    preprocessor.save(save_dir)
    
    # 2. Initialize Environment
    print("\n[2/4] Initializing Environment...")
    env = EcommerceEnvironment(data_dict, max_steps=max_steps)
    print(f"  State dimension:  {env.state_dim}")
    print(f"  Action space:     {env.n_actions} (Discount bins: {env.discount_bins})")
    print(f"  Max steps/ep:     {env.max_steps}")
    
    # 3. Initialize Agent
    print("\n[3/4] Initializing DQN Agent...")
    # Using a slightly larger network for the e-commerce data complexity
    agent = DQNAgent(
        state_dim=env.state_dim,
        n_actions=env.n_actions,
        hidden_dims=(256, 128),
        lr=1e-3,
        gamma=0.99,
        epsilon_start=1.0,
        epsilon_end=0.01,
        epsilon_decay=0.95,
        buffer_capacity=100000,
        batch_size=32,
        target_update_freq=5
    )
    
    # 4. Training Loop
    print(f"\n[4/4] Starting Training for {episodes} episodes...")
    
    episode_rewards = []
    episode_losses = []
    best_reward = float('-inf')
    start_time = time.time()
    
    for episode in range(1, episodes + 1):
        state = env.reset()
        total_reward = 0
        losses = []
        done = False
        step_count = 0
        
        while not done:
            # Agent selects action
            action = agent.select_action(state)
            
            # Environment steps
            next_state, reward, done, info = env.step(action)
            
            # Store experience
            agent.store_experience(state, action, reward, next_state, done)
            
            # Train agent
            loss = agent.train_step()
            if loss is not None and loss > 0:
                losses.append(loss)
                
            state = next_state
            total_reward += reward
            step_count += 1
            
        # End of episode updates
        agent.update_target_network()
        agent.decay_epsilon()
        
        avg_loss = np.mean(losses) if losses else 0
        episode_rewards.append(total_reward)
        episode_losses.append(avg_loss)
        
        # Save best model
        if total_reward > best_reward:
            best_reward = total_reward
            agent.save(os.path.join(save_dir, 'best'))
            print(f"  [Ep {episode:04d}] New Best Reward: {total_reward:.2f} (Epsilon: {agent.epsilon:.3f})")
            
        # Logging
        if episode % 10 == 0 or episode == 1:
            elapsed = time.time() - start_time
            print(f"Episode {episode:04d}/{episodes} | "
                  f"Reward: {total_reward:8.2f} | "
                  f"Loss: {avg_loss:6.4f} | "
                  f"Epsilon: {agent.epsilon:.3f} | "
                  f"Time: {elapsed:.1f}s")
            
        # Save checkpoint periodically
        if episode % 50 == 0:
            agent.save(os.path.join(save_dir, f'epoch_{episode}'))
            
    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE")
    print("=" * 60)
    
    # Save final model
    agent.save(os.path.join(save_dir, 'final'))
    
    # Plot metrics
    print("Generating training plots...")
    plot_metrics(episode_rewards, episode_losses, save_dir)
    
    # Save basic training stats
    stats = {
        'total_episodes': episodes,
        'best_reward': float(best_reward),
        'final_epsilon': float(agent.epsilon),
        'training_time_seconds': float(time.time() - start_time)
    }
    
    import json
    with open(os.path.join(save_dir, 'training_results.json'), 'w') as f:
        json.dump(stats, f, indent=2)
        
    print(f"All artifacts saved to: {save_dir}")
    return agent, stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the E-Commerce Pricing Agent")
    parser.add_argument('--data_dir', type=str, default='data',
                        help='Directory containing the Indian e-commerce CSVs')
    parser.add_argument('--save_dir', type=str, default='model/saved',
                        help='Directory to save the trained model and artifacts')
    parser.add_argument('--episodes', type=int, default=200,
                        help='Number of training episodes')
    parser.add_argument('--batch_size', type=int, default=128,
                        help='Batch size for replay memory')
    parser.add_argument('--max_steps', type=int, default=1000,
                        help='Maximum steps per episode')
                        
    args = parser.parse_args()
    
    # Create save directory if it doesn't exist
    os.makedirs(args.save_dir, exist_ok=True)
    
    train(
        data_dir=args.data_dir,
        save_dir=args.save_dir,
        episodes=args.episodes,
        batch_size=args.batch_size,
        max_steps=args.max_steps
    )
