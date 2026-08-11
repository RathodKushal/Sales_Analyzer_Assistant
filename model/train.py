"""
Training Pipeline for the Sales RL Model
==========================================
Orchestrates the full training loop:
  1. Load & preprocess data
  2. Create the sales environment
  3. Initialize the DQN agent
  4. Run training episodes with experience replay
  5. Track metrics and save checkpoints
  6. Evaluate on held-out validation data
"""

import numpy as np
import time
import json
from pathlib import Path
from datetime import datetime

from model.data_preprocessor import SalesDataPreprocessor
from model.sales_environment import SalesEnvironment
from model.agent import DQNAgent


class TrainingConfig:
    """Training hyperparameters and configuration."""
    
    def __init__(self, **kwargs):
        # Data
        self.data_path: str = kwargs.get('data_path', 'SALES.xlsx')
        self.val_split: float = kwargs.get('val_split', 0.2)
        
        # Training
        self.n_episodes: int = kwargs.get('n_episodes', 200)
        self.max_steps_per_episode: int = kwargs.get('max_steps_per_episode', None)  # None = full dataset
        self.warmup_steps: int = kwargs.get('warmup_steps', 500)
        self.train_frequency: int = kwargs.get('train_frequency', 4)  # Train every N steps
        
        # Agent
        self.lr: float = kwargs.get('lr', 1e-3)
        self.gamma: float = kwargs.get('gamma', 0.95)
        self.epsilon_start: float = kwargs.get('epsilon_start', 1.0)
        self.epsilon_end: float = kwargs.get('epsilon_end', 0.01)
        self.epsilon_decay: float = kwargs.get('epsilon_decay', 0.995)
        self.batch_size: int = kwargs.get('batch_size', 64)
        self.target_update_freq: int = kwargs.get('target_update_freq', 10)
        self.buffer_capacity: int = kwargs.get('buffer_capacity', 50000)
        self.hidden_dims: list = kwargs.get('hidden_dims', [128, 128, 64])
        self.use_prioritized_replay: bool = kwargs.get('use_prioritized_replay', True)
        
        # Output
        self.save_dir: str = kwargs.get('save_dir', 'model/saved')
        self.checkpoint_freq: int = kwargs.get('checkpoint_freq', 25)  # Save every N episodes
        self.log_freq: int = kwargs.get('log_freq', 10)  # Log every N episodes

    def to_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}

    def save(self, path: str):
        with open(path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)


def split_data(data: dict, val_split: float = 0.2) -> tuple:
    """Split the processed data into training and validation sets."""
    n = len(data['states'])
    indices = np.random.permutation(n)
    split_idx = int(n * (1 - val_split))
    
    train_idx = indices[:split_idx]
    val_idx = indices[split_idx:]
    
    train_data = {
        'states': data['states'][train_idx],
        'actions': data['actions'][train_idx],
        'rewards': data['rewards'][train_idx],
    }
    val_data = {
        'states': data['states'][val_idx],
        'actions': data['actions'][val_idx],
        'rewards': data['rewards'][val_idx],
    }
    
    print(f"[Train] Split: {len(train_idx)} training, {len(val_idx)} validation samples")
    return train_data, val_data


def train(config: TrainingConfig = None) -> dict:
    """
    Main training function.
    
    Args:
        config: TrainingConfig with hyperparameters. Uses defaults if None.
    
    Returns:
        dict with training results and metrics.
    """
    if config is None:
        config = TrainingConfig()
    
    print("=" * 60)
    print("  SALES RL MODEL - TRAINING PIPELINE")
    print("=" * 60)
    print(f"  Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Episodes: {config.n_episodes}")
    print(f"  Learning rate: {config.lr}")
    print(f"  Gamma: {config.gamma}")
    print(f"  Batch size: {config.batch_size}")
    print("=" * 60)
    
    start_time = time.time()
    
    # ============================================
    # Step 1: Data Preprocessing
    # ============================================
    print("\n[Step 1/4] Preprocessing data...")
    preprocessor = SalesDataPreprocessor()
    data = preprocessor.process(config.data_path)
    
    # Split into train/val
    train_data, val_data = split_data(data, config.val_split)
    
    # ============================================
    # Step 2: Create Environment
    # ============================================
    print("\n[Step 2/4] Creating sales environment...")
    env = SalesEnvironment(
        states=train_data['states'],
        actions=train_data['actions'],
        rewards=train_data['rewards'],
        n_actions=data['n_actions'],
        discount_bins=preprocessor.discount_bins,
    )
    
    val_env = SalesEnvironment(
        states=val_data['states'],
        actions=val_data['actions'],
        rewards=val_data['rewards'],
        n_actions=data['n_actions'],
        discount_bins=preprocessor.discount_bins,
    )
    
    # ============================================
    # Step 3: Initialize Agent
    # ============================================
    print("\n[Step 3/4] Initializing DQN agent...")
    agent = DQNAgent(
        state_dim=data['state_dim'],
        n_actions=data['n_actions'],
        lr=config.lr,
        gamma=config.gamma,
        epsilon_start=config.epsilon_start,
        epsilon_end=config.epsilon_end,
        epsilon_decay=config.epsilon_decay,
        batch_size=config.batch_size,
        target_update_freq=config.target_update_freq,
        buffer_capacity=config.buffer_capacity,
        hidden_dims=config.hidden_dims,
        use_prioritized_replay=config.use_prioritized_replay,
    )
    
    print(f"  Q-Network: {sum(p.numel() for p in agent.q_network.parameters())} parameters")
    print(f"  State dim: {data['state_dim']}, Actions: {data['n_actions']}")
    
    # ============================================
    # Step 4: Training Loop
    # ============================================
    print(f"\n[Step 4/4] Training for {config.n_episodes} episodes...")
    
    # Metrics tracking
    episode_rewards = []
    episode_losses = []
    val_rewards = []
    best_val_reward = -np.inf
    total_steps = 0
    
    for episode in range(1, config.n_episodes + 1):
        # --- Training Episode ---
        state = env.reset(shuffle=True)
        episode_reward = 0
        episode_loss = 0
        step_count = 0
        done = False
        
        while not done:
            # Select action
            action = agent.select_action(state, training=True)
            
            # Step environment
            next_state, reward, done, info = env.step(action)
            
            # Store experience
            agent.store_experience(state, action, reward, next_state, float(done))
            
            # Train the network
            if total_steps > config.warmup_steps and total_steps % config.train_frequency == 0:
                loss = agent.train_step()
                episode_loss += loss
                
                # Soft update target network every step for smooth tracking
                agent.soft_update_target_network(tau=0.005)
            
            episode_reward += info['raw_reward']  # Track raw profit, not normalized
            state = next_state
            total_steps += 1
            step_count += 1
            
            # Optional: limit steps per episode
            if config.max_steps_per_episode and step_count >= config.max_steps_per_episode:
                break
        
        # Decay epsilon after each episode
        agent.decay_epsilon()
        
        # Hard update target network periodically
        if episode % config.target_update_freq == 0:
            agent.update_target_network()
        
        # Update learning rate
        agent.scheduler.step()
        
        # Track metrics
        mean_reward = episode_reward / max(step_count, 1)
        episode_rewards.append(mean_reward)
        episode_losses.append(episode_loss / max(step_count, 1))
        
        # --- Validation ---
        if episode % config.log_freq == 0 or episode == config.n_episodes:
            val_reward = _evaluate_episode(agent, val_env)
            val_rewards.append(val_reward)
            
            print(f"  Episode {episode:4d}/{config.n_episodes} | "
                  f"Train Reward: {mean_reward:8.2f} | "
                  f"Val Reward: {val_reward:8.2f} | "
                  f"Loss: {episode_losses[-1]:.4f} | "
                  f"Epsilon: {agent.epsilon:.3f} | "
                  f"LR: {agent.optimizer.param_groups[0]['lr']:.6f}")
            
            # Save best model
            if val_reward > best_val_reward:
                best_val_reward = val_reward
                _save_checkpoint(agent, preprocessor, config, 'best')
        
        # --- Periodic Checkpoint ---
        if episode % config.checkpoint_freq == 0:
            _save_checkpoint(agent, preprocessor, config, f'epoch_{episode}')
    
    # ============================================
    # Final Save
    # ============================================
    _save_checkpoint(agent, preprocessor, config, 'final')
    
    elapsed = time.time() - start_time
    
    # Compile results
    results = {
        'total_episodes': config.n_episodes,
        'total_steps': total_steps,
        'training_time_seconds': elapsed,
        'best_val_reward': best_val_reward,
        'final_epsilon': agent.epsilon,
        'episode_rewards': episode_rewards,
        'episode_losses': episode_losses,
        'val_rewards': val_rewards,
    }
    
    # Save results
    save_dir = Path(config.save_dir)
    with open(save_dir / "training_results.json", 'w') as f:
        json.dump({
            k: v if not isinstance(v, np.floating) else float(v)
            for k, v in results.items()
            if not isinstance(v, list)
        }, f, indent=2)
    
    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE")
    print("=" * 60)
    print(f"  Time: {elapsed:.1f}s ({elapsed/60:.1f} min)")
    print(f"  Total steps: {total_steps:,}")
    print(f"  Best validation reward: {best_val_reward:.2f}")
    print(f"  Final epsilon: {agent.epsilon:.4f}")
    print(f"  Models saved to: {config.save_dir}")
    print("=" * 60)
    
    return results


def _evaluate_episode(agent: DQNAgent, env: SalesEnvironment) -> float:
    """Run one greedy evaluation episode and return the mean reward."""
    state = env.reset(shuffle=False)
    total_reward = 0
    steps = 0
    done = False
    
    while not done:
        action = agent.select_action(state, training=False)  # Greedy
        next_state, _, done, info = env.step(action)
        total_reward += info['raw_reward']
        state = next_state
        steps += 1
    
    return total_reward / max(steps, 1)


def _save_checkpoint(agent, preprocessor, config, tag: str):
    """Save a training checkpoint."""
    save_dir = Path(config.save_dir) / tag
    save_dir.mkdir(parents=True, exist_ok=True)
    agent.save(str(save_dir))
    preprocessor.save(str(save_dir))
    config.save(str(save_dir / "training_config.json"))


# ============================================================
# Entry point
# ============================================================
if __name__ == '__main__':
    config = TrainingConfig(
        data_path='SALES.xlsx',
        n_episodes=200,
        lr=1e-3,
        gamma=0.95,
        batch_size=64,
        hidden_dims=[128, 128, 64],
        save_dir='model/saved',
    )
    
    results = train(config)
