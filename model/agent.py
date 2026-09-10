"""
Deep Q-Network (DQN) Agent for Sales Discount Optimization
============================================================
Implements a DQN agent with:
  - Experience Replay buffer for stable training
  - Target Network for reducing overestimation
  - Epsilon-Greedy exploration with decay
  - Double DQN for improved value estimation
  - Dueling architecture for better state-action decomposition
"""

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from collections import deque, namedtuple
import random
import json
from pathlib import Path


# Named tuple for experience replay
Experience = namedtuple('Experience', ['state', 'action', 'reward', 'next_state', 'done'])


class DuelingQNetwork(nn.Module):
    """
    Dueling DQN architecture that separates state-value and advantage streams.
    
    This helps the agent learn which states are valuable independent of 
    which action is taken — crucial for sales optimization where some 
    product-segment combinations are inherently more profitable.
    
    Architecture:
        Input -> Shared Layers -> Split into:
            Value Stream:     -> V(s)       (scalar)
            Advantage Stream: -> A(s, a)    (one per action)
        Q(s,a) = V(s) + A(s,a) - mean(A(s,:))
    """

    def __init__(self, state_dim: int, n_actions: int, hidden_dims: list = None):
        super().__init__()
        
        if hidden_dims is None:
            hidden_dims = [128, 128, 64]
        
        # Shared feature extraction layers
        shared_layers = []
        in_dim = state_dim
        for h_dim in hidden_dims[:-1]:
            shared_layers.extend([
                nn.Linear(in_dim, h_dim),
                nn.LayerNorm(h_dim),
                nn.ReLU(),
                nn.Dropout(0.1),
            ])
            in_dim = h_dim
        
        self.shared = nn.Sequential(*shared_layers)
        
        last_hidden = hidden_dims[-1]
        
        # Value stream: estimates V(s)
        self.value_stream = nn.Sequential(
            nn.Linear(in_dim, last_hidden),
            nn.ReLU(),
            nn.Linear(last_hidden, 1)
        )
        
        # Advantage stream: estimates A(s, a)
        self.advantage_stream = nn.Sequential(
            nn.Linear(in_dim, last_hidden),
            nn.ReLU(),
            nn.Linear(last_hidden, n_actions)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        shared_out = self.shared(x)
        
        value = self.value_stream(shared_out)           # (batch, 1)
        advantage = self.advantage_stream(shared_out)   # (batch, n_actions)
        
        # Combine: Q(s,a) = V(s) + (A(s,a) - mean(A(s,:)))
        q_values = value + advantage - advantage.mean(dim=1, keepdim=True)
        return q_values


class ReplayBuffer:
    """
    Fixed-size experience replay buffer.
    
    Stores past experiences and allows random sampling for breaking
    correlation between consecutive training samples.
    """

    def __init__(self, capacity: int = 50000):
        self.buffer = deque(maxlen=capacity)

    def push(self, state, action, reward, next_state, done):
        self.buffer.append(Experience(state, action, reward, next_state, done))

    def sample(self, batch_size: int, beta: float = 0.4, **kwargs) -> list:
        return random.sample(self.buffer, min(batch_size, len(self.buffer)))

    def __len__(self):
        return len(self.buffer)


class PrioritizedReplayBuffer:
    """
    Prioritized Experience Replay buffer.
    
    Samples experiences proportional to their TD error — the agent 
    learns more from surprising experiences (high error).
    """

    def __init__(self, capacity: int = 50000, alpha: float = 0.6):
        self.capacity = capacity
        self.alpha = alpha  # How much prioritization to use (0 = uniform, 1 = full)
        self.buffer = []
        self.priorities = np.zeros(capacity, dtype=np.float32)
        self.position = 0
        self._max_priority = 1.0

    def push(self, state, action, reward, next_state, done):
        exp = Experience(state, action, reward, next_state, done)
        
        if len(self.buffer) < self.capacity:
            self.buffer.append(exp)
        else:
            self.buffer[self.position] = exp
        
        self.priorities[self.position] = self._max_priority
        self.position = (self.position + 1) % self.capacity

    def sample(self, batch_size: int, beta: float = 0.4) -> tuple:
        n = len(self.buffer)
        priorities = self.priorities[:n] ** self.alpha
        probabilities = priorities / priorities.sum()
        
        indices = np.random.choice(n, size=min(batch_size, n), p=probabilities, replace=False)
        experiences = [self.buffer[i] for i in indices]
        
        # Importance sampling weights
        weights = (n * probabilities[indices]) ** (-beta)
        weights /= weights.max()
        
        return experiences, indices, torch.FloatTensor(weights)

    def update_priorities(self, indices, td_errors):
        for idx, td_error in zip(indices, td_errors):
            priority = abs(td_error) + 1e-6
            self.priorities[idx] = priority
            self._max_priority = max(self._max_priority, priority)

    def __len__(self):
        return len(self.buffer)


class DQNAgent:
    """
    Deep Q-Network Agent for e-commerce pricing optimization.
    
    Uses Double DQN with Dueling architecture, prioritized experience 
    replay, and epsilon-greedy exploration with decay.
    
    The agent learns to recommend the optimal discount level for each
    e-commerce transaction to maximize profit.
    
    Args:
        state_dim: Dimensionality of the state space
        n_actions: Number of discrete actions (discount bins)
        lr: Learning rate
        gamma: Discount factor for future rewards
        epsilon_start: Initial exploration rate
        epsilon_end: Minimum exploration rate
        epsilon_decay: Rate of exploration decay
        batch_size: Mini-batch size for training
        target_update_freq: How often to sync the target network
        buffer_capacity: Size of the experience replay buffer
        hidden_dims: List of hidden layer sizes for the Q-network
        use_prioritized_replay: Whether to use prioritized experience replay
    """

    def __init__(
        self,
        state_dim: int,
        n_actions: int,
        lr: float = 1e-3,
        gamma: float = 0.95,
        epsilon_start: float = 1.0,
        epsilon_end: float = 0.01,
        epsilon_decay: float = 0.995,
        batch_size: int = 64,
        target_update_freq: int = 10,
        buffer_capacity: int = 50000,
        hidden_dims: list = None,
        use_prioritized_replay: bool = True,
    ):
        self.state_dim = state_dim
        self.n_actions = n_actions
        self.gamma = gamma
        self.epsilon = epsilon_start
        self.epsilon_end = epsilon_end
        self.epsilon_decay = epsilon_decay
        self.batch_size = batch_size
        self.target_update_freq = target_update_freq
        self.use_prioritized_replay = use_prioritized_replay
        
        # Set device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"[Agent] Using device: {self.device}")
        
        # Networks
        if hidden_dims is None:
            hidden_dims = [128, 128, 64]
        
        self.q_network = DuelingQNetwork(state_dim, n_actions, hidden_dims).to(self.device)
        self.target_network = DuelingQNetwork(state_dim, n_actions, hidden_dims).to(self.device)
        self.target_network.load_state_dict(self.q_network.state_dict())
        self.target_network.eval()
        
        # Optimizer with weight decay for regularization
        self.optimizer = optim.Adam(self.q_network.parameters(), lr=lr, weight_decay=1e-5)
        
        # Learning rate scheduler
        self.scheduler = optim.lr_scheduler.StepLR(self.optimizer, step_size=50, gamma=0.9)
        
        # Experience replay
        if use_prioritized_replay:
            self.replay_buffer = PrioritizedReplayBuffer(capacity=buffer_capacity)
        else:
            self.replay_buffer = ReplayBuffer(capacity=buffer_capacity)
        
        # Training metrics
        self.training_step = 0
        self.losses = []
        self.epsilons = []

    def select_action(self, state: np.ndarray, training: bool = True) -> int:
        """
        Select an action using epsilon-greedy policy.
        
        Args:
            state: Current state observation
            training: If True, use epsilon-greedy. If False, use greedy.
        
        Returns:
            Action index (discount bin)
        """
        if training and random.random() < self.epsilon:
            return random.randint(0, self.n_actions - 1)
        
        with torch.no_grad():
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.q_network(state_tensor)
            return q_values.argmax(dim=1).item()

    def get_q_values(self, state: np.ndarray) -> np.ndarray:
        """Get Q-values for all actions given a state."""
        with torch.no_grad():
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.q_network(state_tensor)
            return q_values.cpu().numpy().flatten()

    def store_experience(self, state, action, reward, next_state, done):
        """Store a transition in the replay buffer."""
        self.replay_buffer.push(state, action, reward, next_state, done)

    def train_step(self) -> float:
        """
        Perform one training step using a batch from the replay buffer.
        
        Returns:
            The loss value for this step.
        """
        if len(self.replay_buffer) < self.batch_size:
            return 0.0
        
        if self.use_prioritized_replay:
            # Beta annealing for importance sampling
            beta = min(1.0, 0.4 + self.training_step * 0.001)
            experiences, indices, weights = self.replay_buffer.sample(
                self.batch_size, beta=beta
            )
        else:
            experiences = self.replay_buffer.sample(self.batch_size)
            weights = torch.ones(len(experiences))
            indices = None
        
        # Unpack experiences
        states = torch.FloatTensor(
            np.array([e.state for e in experiences])
        ).to(self.device)
        actions = torch.LongTensor(
            [e.action for e in experiences]
        ).to(self.device)
        rewards = torch.FloatTensor(
            [e.reward for e in experiences]
        ).to(self.device)
        next_states = torch.FloatTensor(
            np.array([e.next_state for e in experiences])
        ).to(self.device)
        dones = torch.FloatTensor(
            [e.done for e in experiences]
        ).to(self.device)
        weights = weights.to(self.device)
        
        # Current Q-values
        current_q = self.q_network(states).gather(1, actions.unsqueeze(1)).squeeze(1)
        
        # Double DQN: use online network to select action, target network to evaluate
        with torch.no_grad():
            next_actions = self.q_network(next_states).argmax(dim=1)
            next_q = self.target_network(next_states).gather(
                1, next_actions.unsqueeze(1)
            ).squeeze(1)
            target_q = rewards + self.gamma * next_q * (1 - dones)
        
        # Weighted Huber loss (smooth L1)
        td_errors = target_q - current_q
        loss = (weights * nn.functional.smooth_l1_loss(
            current_q, target_q, reduction='none'
        )).mean()
        
        # Optimize
        self.optimizer.zero_grad()
        loss.backward()
        # Gradient clipping for stability
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), max_norm=1.0)
        self.optimizer.step()
        
        # Update priorities in PER buffer
        if self.use_prioritized_replay and indices is not None:
            self.replay_buffer.update_priorities(
                indices, td_errors.detach().cpu().numpy()
            )
        
        self.training_step += 1
        loss_val = loss.item()
        self.losses.append(loss_val)
        
        return loss_val

    def update_target_network(self):
        """Hard update: copy weights from Q-network to target network."""
        self.target_network.load_state_dict(self.q_network.state_dict())

    def soft_update_target_network(self, tau: float = 0.005):
        """Soft update: blend target network weights towards Q-network."""
        for target_param, q_param in zip(
            self.target_network.parameters(), self.q_network.parameters()
        ):
            target_param.data.copy_(tau * q_param.data + (1 - tau) * target_param.data)

    def decay_epsilon(self):
        """Decay the exploration rate."""
        self.epsilon = max(self.epsilon_end, self.epsilon * self.epsilon_decay)
        self.epsilons.append(self.epsilon)

    def save(self, directory: str):
        """Save the agent's model, optimizer, and config."""
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)
        
        # Save model weights
        torch.save(self.q_network.state_dict(), directory / "q_network.pth")
        torch.save(self.target_network.state_dict(), directory / "target_network.pth")
        torch.save(self.optimizer.state_dict(), directory / "optimizer.pth")
        
        # Save config
        config = {
            'state_dim': self.state_dim,
            'n_actions': self.n_actions,
            'gamma': self.gamma,
            'epsilon': self.epsilon,
            'epsilon_end': self.epsilon_end,
            'epsilon_decay': self.epsilon_decay,
            'batch_size': self.batch_size,
            'target_update_freq': self.target_update_freq,
            'training_step': self.training_step,
            'use_prioritized_replay': self.use_prioritized_replay,
        }
        with open(directory / "agent_config.json", 'w') as f:
            json.dump(config, f, indent=2)
        
        # Save training history
        history = {
            'losses': self.losses[-1000:],  # Last 1000 to keep file size manageable
            'epsilons': self.epsilons[-1000:],
        }
        with open(directory / "training_history.json", 'w') as f:
            json.dump(history, f)
        
        print(f"[Agent] Model saved to {directory}")

    def load(self, directory: str):
        """Load a previously saved agent."""
        directory = Path(directory)
        
        # Load config first to reconstruct
        with open(directory / "agent_config.json", 'r') as f:
            config = json.load(f)
        
        self.epsilon = config.get('epsilon', 0.01)
        self.training_step = config.get('training_step', 0)
        
        hidden_dims = config.get('hidden_dims', [256, 128])
        self.q_network = DuelingQNetwork(self.state_dim, self.n_actions, hidden_dims).to(self.device)
        self.target_network = DuelingQNetwork(self.state_dim, self.n_actions, hidden_dims).to(self.device)

        # Load weights
        self.q_network.load_state_dict(
            torch.load(directory / "q_network.pth", map_location=self.device, weights_only=True)
        )
        self.target_network.load_state_dict(
            torch.load(directory / "target_network.pth", map_location=self.device, weights_only=True)
        )
        try:
            self.optimizer.load_state_dict(
                torch.load(directory / "optimizer.pth", map_location=self.device, weights_only=True)
            )
        except Exception as opt_err:
            print(f"[Agent] Note: Optimizer weights skipped for inference ({opt_err})")
        
        # Load training history if available
        history_path = directory / "training_history.json"
        if history_path.exists():
            with open(history_path, 'r') as f:
                history = json.load(f)
            self.losses = history.get('losses', [])
            self.epsilons = history.get('epsilons', [])
        
        print(f"[Agent] Model loaded from {directory}")
        print(f"[Agent] Epsilon: {self.epsilon:.4f}, Training steps: {self.training_step}")
