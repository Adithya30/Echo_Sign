"""
EchoSign Dynamic Sequence Gesture Recognizer
========================================
Supports dynamic video-based sequences using an LSTM model trained on ASL words.
"""

import numpy as np
import json
import logging
from pathlib import Path
from collections import deque
import os
import warnings
warnings.filterwarnings("ignore", message="Compiled the loaded model, but the compiled metrics have yet to be built.")

# Silence TensorFlow / Keras warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
import tensorflow as tf
tf.get_logger().setLevel('ERROR')

logger = logging.getLogger(__name__)

class GestureRecognizer:
    MODEL_DIR = Path(__file__).parent

    def __init__(self):
        # ── Config ─────────────────────────────────────────────────────────
        self.sequence_length = 30
        self.landmark_count  = 21
        self.feature_size    = self.landmark_count * 3  # 63 features
        self.confidence_threshold = 0.5

        # ── State ──────────────────────────────────────────────────────────
        self.model       = None
        self.labels      = []
        self.mode        = "demo"
        self._ready      = False
        
        # Dictionary of session buffers (mapped by session_id)
        self.session_buffers = {}

        self._load_models()

    def _load_models(self):
        """Load the LSTM sequence model."""
        model_path = self.MODEL_DIR / 'lstm_action_model.h5'
        labels_path= self.MODEL_DIR / 'lstm_labels.json'
        
        if model_path.exists():
            try:
                self.model = tf.keras.models.load_model(str(model_path))
                if labels_path.exists():
                    with open(labels_path) as f:
                        self.labels = json.load(f)
                self.mode = "lstm"
                logger.info(f"✅ LSTM Engine Loaded — {len(self.labels)} signs")
            except Exception as e:
                logger.warning(f"LSTM Engine load failed: {e}")
                self.mode = "demo"
        else:
            logger.info("ℹ️ No LSTM Engine found — using demo fallback")
            self.mode = "demo"

        self._ready = True

    def get_labels(self) -> list:
        return self.labels
        
    def is_ready(self) -> bool:
        return self._ready
        
    def get_mode(self) -> str:
        return self.mode

    def _landmarks_to_features(self, landmarks) -> np.ndarray:
        """
        Convert landmark list → normalized 63-float numpy array.
        Normalization: wrist-relative + scale-independent.
        """
        features = []
        for lm in landmarks:
            if isinstance(lm, (list, tuple)) and len(lm) >= 3:
                features.extend([float(lm[0]), float(lm[1]), float(lm[2])])
            elif isinstance(lm, dict):
                features.extend([lm.get('x', 0.0), lm.get('y', 0.0), lm.get('z', 0.0)])
            else:
                features.extend([0.0, 0.0, 0.0])

        while len(features) < self.feature_size:
            features.append(0.0)
        arr = np.array(features[:self.feature_size], dtype=np.float32)

        # Normalize: wrist-relative + scale-independent
        coords = arr.reshape(21, 3)
        wrist = coords[0].copy()
        coords -= wrist
        max_dist = np.max(np.abs(coords)) + 1e-8
        coords /= max_dist
        return np.clip(coords.flatten(), -1.0, 1.0)

    def predict(self, landmarks, session_id='default') -> dict | None:
        """Predict gesture using the LSTM sequence model across buffered state."""
        if not landmarks: 
            return None
        
        # Check if frontend blasted an array of 30 frames directly
        if len(landmarks) > 0 and isinstance(landmarks[0], list) and len(landmarks[0]) == 21:
            if len(landmarks) >= self.sequence_length:
                # Process the last sequence_length frames
                seq_features = [self._landmarks_to_features(frame) for frame in landmarks[-self.sequence_length:]]
                self.session_buffers[session_id] = deque(seq_features, maxlen=self.sequence_length)
            else:
                for frame in landmarks:
                    self.session_buffers.setdefault(session_id, deque(maxlen=self.sequence_length)).append(self._landmarks_to_features(frame))
        else:
            # Single frame mode
            features = self._landmarks_to_features(landmarks)
            self.session_buffers.setdefault(session_id, deque(maxlen=self.sequence_length)).append(features)
        
        # Wait until we have enough frames...
        if len(self.session_buffers[session_id]) < self.sequence_length:
            return None

        # Format input (1, sequence_length, 63)
        sequence_data = np.array(self.session_buffers[session_id])
        
        try:
            if self.mode == "lstm" and self.model:
                inp = sequence_data.reshape(1, self.sequence_length, self.feature_size)
                probs = self.model.predict(inp, verbose=0)[0]
                
                top_idx = int(np.argmax(probs))
                top_conf = float(probs[top_idx])
                top_word = self.labels[top_idx]
                
                logger.info(f"LSTM Predict -> {top_word} : {top_conf:.3f}")
                
                if top_conf < self.confidence_threshold:
                    return None
                    
                # To prevent continuous trigger of the same word, 
                # you typically might clear the buffer or wait before repeating.
                # For demo simplicity, we flush local state so it restarts tracking:
                self.session_buffers[session_id].clear()
                
                # Check for emergency keywords
                emergency_list = ["Help", "Danger", "Fire", "Emergency", "Ambulance", "No", "Stop"]
                is_emergency = any(kw.lower() in top_word.lower() for kw in emergency_list)
                
                return {
                    'word': top_word,
                    'confidence': round(top_conf, 3),
                    'mode': 'repo_lstm',
                    'is_emergency': is_emergency,
                    'all_predictions': []
                }
            return self._predict_demo(features)
        except Exception as e:
            logger.error(f"LSTM Predict failed: {e}")
            return self._predict_demo(features)

    def _predict_demo(self, features, mode_label='demo') -> dict:
        """Heuristic demo predictor — fallback."""
        x_coords = features[0::3]
        y_coords = features[1::3]
        x_spread = float(np.max(x_coords) - np.min(x_coords))
        y_spread = float(np.max(y_coords) - np.min(y_coords))
        ratio = x_spread / (y_spread + 1e-5)
        
        default_labels = ["Hello", "Thank You", "Yes", "No", "Drink", "Eat", "Come", "Go"]
        label_idx = int(abs(ratio * 10)) % len(default_labels)
        confidence = float(np.clip(0.55 + x_spread * 0.20, 0.50, 0.75))
        
        return {
            'word': default_labels[label_idx],
            'confidence': round(confidence, 3),
            'mode': mode_label,
            'is_emergency': False,
            'all_predictions': []
        }
