import os
import sys
from pathlib import Path

# Add backend to path
BACKEND_DIR = Path(r"c:\Users\USER\OneDrive\Desktop\EchoSign\backend")
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'echosign.settings')

try:
    from ai_model.gesture_recognizer import GestureRecognizer
    import numpy as np

    print("--- Initializing GestureRecognizer ---")
    recognizer = GestureRecognizer()
    print(f"Mode: {recognizer.mode}")
    print(f"Labels: {recognizer.labels}")

    # Mock landmarks (all zeros or random)
    mock_landmarks = [[0.5, 0.5, 0.0]] * 21
    print("\n--- Testing Prediction ---")
    result = recognizer.predict(mock_landmarks)
    print(f"Result: {result}")

except Exception as e:
    print(f"\n[ERROR] Test failed: {e}")
    import traceback
    traceback.print_exc()
