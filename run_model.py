"""
Main Entry Point — Sales RL Model
===================================
Run this script to train, evaluate, and visualize the model.

Usage:
    python run_model.py              # Train with defaults
    python run_model.py --episodes 300 --lr 0.0005
    python run_model.py --evaluate   # Evaluate a trained model
"""

import argparse
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model.train import train, TrainingConfig
from model.evaluate import ModelEvaluator, generate_training_plots
from model.data_preprocessor import SalesDataPreprocessor
from model.agent import DQNAgent


def main():
    parser = argparse.ArgumentParser(description='Sales RL Model — Train & Evaluate')
    
    # Mode
    parser.add_argument('--evaluate', action='store_true',
                        help='Evaluate an already-trained model instead of training')
    
    # Data
    parser.add_argument('--data', type=str, default='SALES.xlsx',
                        help='Path to the sales data file')
    
    # Training hyperparameters
    parser.add_argument('--episodes', type=int, default=200,
                        help='Number of training episodes')
    parser.add_argument('--lr', type=float, default=1e-3,
                        help='Learning rate')
    parser.add_argument('--gamma', type=float, default=0.95,
                        help='Discount factor')
    parser.add_argument('--batch-size', type=int, default=64,
                        help='Batch size for replay training')
    parser.add_argument('--epsilon-start', type=float, default=1.0,
                        help='Initial exploration rate')
    parser.add_argument('--epsilon-end', type=float, default=0.01,
                        help='Final exploration rate')
    parser.add_argument('--epsilon-decay', type=float, default=0.995,
                        help='Epsilon decay rate per episode')
    parser.add_argument('--hidden-dims', type=int, nargs='+', default=[128, 128, 64],
                        help='Hidden layer dimensions')
    
    # Output
    parser.add_argument('--save-dir', type=str, default='model/saved',
                        help='Directory to save model checkpoints')
    parser.add_argument('--model-path', type=str, default='model/saved/best',
                        help='Path to load model for evaluation')
    
    args = parser.parse_args()
    
    if args.evaluate:
        # ========== Evaluation Mode ==========
        print("\n[EVAL] Running in EVALUATION mode\n")
        
        # Load preprocessor
        preprocessor = SalesDataPreprocessor()
        preprocessor.load_saved(args.model_path)
        
        # Process data
        data = preprocessor.process(args.data)
        
        # Load agent
        agent = DQNAgent(
            state_dim=data['state_dim'],
            n_actions=data['n_actions'],
            hidden_dims=args.hidden_dims,
        )
        agent.load(args.model_path)
        
        # Evaluate
        evaluator = ModelEvaluator(agent, preprocessor)
        metrics = evaluator.evaluate_full(data, df=data['dataframe'])
        evaluator.save_results(f'{args.save_dir}/evaluation_results.json')
        
    else:
        # ========== Training Mode ==========
        print("\n[TRAIN] Running in TRAINING mode\n")
        
        config = TrainingConfig(
            data_path=args.data,
            n_episodes=args.episodes,
            lr=args.lr,
            gamma=args.gamma,
            batch_size=args.batch_size,
            epsilon_start=args.epsilon_start,
            epsilon_end=args.epsilon_end,
            epsilon_decay=args.epsilon_decay,
            hidden_dims=args.hidden_dims,
            save_dir=args.save_dir,
        )
        
        # Train
        results = train(config)
        
        # Generate training plots
        generate_training_plots(results, args.save_dir)
        
        # Run final evaluation on full data
        print("\n\n[EVAL] Running post-training evaluation...\n")
        
        preprocessor = SalesDataPreprocessor()
        preprocessor.load_saved(f'{args.save_dir}/best')
        data = preprocessor.process(args.data)
        
        agent = DQNAgent(
            state_dim=data['state_dim'],
            n_actions=data['n_actions'],
            hidden_dims=args.hidden_dims,
        )
        agent.load(f'{args.save_dir}/best')
        
        evaluator = ModelEvaluator(agent, preprocessor)
        metrics = evaluator.evaluate_full(data, df=data['dataframe'])
        evaluator.save_results(f'{args.save_dir}/evaluation_results.json')
        
        print("\n[DONE] Training and evaluation complete!")
        print(f"   Model saved at: {args.save_dir}/best/")
        print(f"   Plots saved at: {args.save_dir}/training_metrics.png")
        print(f"   Results saved at: {args.save_dir}/evaluation_results.json")


if __name__ == '__main__':
    main()
