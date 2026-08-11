import json

# Agent config
with open('model/saved/best/agent_config.json') as f:
    agent = json.load(f)
print('=== AGENT CONFIG ===')
for k,v in agent.items():
    print(f'  {k}: {v}')

# Training config
with open('model/saved/best/training_config.json') as f:
    train_cfg = json.load(f)
print('\n=== TRAINING CONFIG ===')
for k,v in train_cfg.items():
    print(f'  {k}: {v}')

# Preprocessor config
with open('model/saved/best/preprocessor_config.json') as f:
    prep = json.load(f)
print('\n=== PREPROCESSOR CONFIG ===')
for k,v in prep.items():
    print(f'  {k}: {v}')

# Training history
with open('model/saved/best/training_history.json') as f:
    hist = json.load(f)
losses = hist.get('losses', [])
epsilons = hist.get('epsilons', [])
print('\n=== TRAINING PROGRESS ===')
print(f'  Training steps completed: {len(losses)}')
if epsilons:
    print(f'  Current epsilon: {epsilons[-1]:.6f}')
if losses:
    print(f'  Latest loss: {losses[-1]:.6f}')
    print(f'  Min loss: {min(losses):.6f}')
    print(f'  Max loss: {max(losses):.6f}')
    n100 = min(len(losses), 100)
    n500 = min(len(losses), 500)
    print(f'  Avg loss (last 100): {sum(losses[-100:])/n100:.6f}')
    print(f'  Avg loss (last 500): {sum(losses[-500:])/n500:.6f}')
    print(f'  Avg loss (all): {sum(losses)/len(losses):.6f}')

# Check all saved checkpoints
import os
print('\n=== SAVED CHECKPOINTS ===')
for root, dirs, files in os.walk('model/saved'):
    level = root.replace('model/saved', '').count(os.sep)
    indent = '  ' * level
    basename = os.path.basename(root)
    if basename != 'saved':
        print(f'{indent}[{basename}]')
