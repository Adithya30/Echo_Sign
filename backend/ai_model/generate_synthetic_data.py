"""
Synthetic Data Generator for EchoSign AI
Generates dummy sequence data to allow model training for demo purposes.
"""
import numpy as np
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
GESTURE_LABELS = [
    "Hello", "Thank You", "Please", "Sorry", "Yes", "No",
    "Help", "Doctor", "Emergency", "Water", "Food", "Good",
    "Bad", "Love", "Family", "Friend", "Home", "School",
    "Hospital", "Police", "Fire", "Ambulance", "Danger",
    "Stop", "Go", "Come", "Wait", "Understand", "Again", "More"
]

FRAMES = 30
FEATURES = 63
SEQUENCES_PER_SIGN = 10

def generate():
    DATA_DIR.mkdir(exist_ok=True)
    print(f"Generating synthetic data in {DATA_DIR}...")
    
    for label in GESTURE_LABELS:
        sign_dir = DATA_DIR / label
        sign_dir.mkdir(exist_ok=True)
        
        for i in range(SEQUENCES_PER_SIGN):
            # Generate a base pattern for this sign
            base = np.random.uniform(0, 1, (1, FEATURES))
            
            # Create a sequence with slight movement
            # We add a trend to make it look like a real movement
            trend = np.linspace(0, 0.1, FRAMES).reshape(-1, 1) * np.random.normal(0, 1, (1, FEATURES))
            noise = np.random.normal(0, 0.02, (FRAMES, FEATURES))
            
            sequence = np.tile(base, (FRAMES, 1)) + trend + noise
            sequence = np.clip(sequence, 0, 1)
            
            np.save(sign_dir / f"sync_{i}.npy", sequence.astype(np.float32))
        
        print(f"  Generated {SEQUENCES_PER_SIGN} sequences for '{label}'")

    print("\nDone! You can now run train_model.py")

if __name__ == "__main__":
    generate()
