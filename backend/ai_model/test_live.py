"""
========================================================
EchoSign AI - Step 3: Live Model Tester
========================================================
HOW TO RUN:
    cd C:\\Users\\USER\\OneDrive\\Desktop\\EchoSign\\backend
    python ai_model/test_live.py

WHAT IT DOES:
    - Opens webcam
    - Collects 30 frames as you sign
    - Shows prediction + confidence bar in real time
    - Logs what it predicted and whether it was correct
    - Press SPACE to manually trigger a prediction
    - Press R to record a 30-frame clip and predict
    - Press Q to quit

USE THIS TO:
    - Verify your trained model works
    - See which signs are weak (need more training data)
    - Demonstrate the system
========================================================
"""

import cv2
import mediapipe as mp
import numpy as np
import json
from pathlib import Path
from collections import deque
import time

# ─────────────────────────────────────────────────────────────────────────────
MODEL_PATH  = Path(__file__).parent / "echosign_model.h5"
LABELS_PATH = Path(__file__).parent / "labels.json"
FRAMES      = 30
FEATURES    = 63
THRESHOLD   = 0.50   # Minimum confidence to display prediction
# ─────────────────────────────────────────────────────────────────────────────

try:
    import tensorflow as tf
    model = tf.keras.models.load_model(str(MODEL_PATH))
    with open(LABELS_PATH) as f:
        LABELS = json.load(f)
    print(f"✅ Model loaded — {len(LABELS)} signs: {LABELS}")
except Exception as e:
    print(f"❌ Could not load model: {e}")
    print("   Run train_model.py first!")
    exit(1)

mp_hands  = mp.solutions.hands
mp_draw   = mp.solutions.drawing_utils
mp_styles = mp.solutions.drawing_styles


def get_landmarks(results) -> np.ndarray:
    if results.multi_hand_landmarks:
        lm = results.multi_hand_landmarks[0]
        coords = np.array([[p.x, p.y, p.z] for p in lm.landmark])
        wrist = coords[0]
        coords = coords - wrist
        max_dist = np.max(np.abs(coords)) + 1e-8
        return (coords / max_dist).flatten()
    return np.zeros(FEATURES)


def predict_sequence(sequence: np.ndarray):
    """Run LSTM prediction on a 30-frame sequence."""
    inp = sequence.reshape(1, FRAMES, FEATURES)
    probs = model.predict(inp, verbose=0)[0]
    top3_idx = np.argsort(probs)[::-1][:3]
    return [
        {'word': LABELS[i], 'confidence': float(probs[i])}
        for i in top3_idx
    ]


def draw_prediction(frame, predictions, is_recording, frames_collected):
    h, w = frame.shape[:2]

    # Top bar
    cv2.rectangle(frame, (0, 0), (w, 55), (10, 15, 30), -1)

    if is_recording:
        progress_pct = frames_collected / FRAMES
        bar_w = int(progress_pct * (w - 20))
        cv2.rectangle(frame, (10, 40), (w - 10, 52), (40, 40, 40), -1)
        cv2.rectangle(frame, (10, 40), (10 + bar_w, 52), (0, 200, 100), -1)
        cv2.putText(frame, f"● RECORDING ({frames_collected}/{FRAMES})", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 80, 255), 2)
    else:
        cv2.putText(frame, "EchoSign Live (Press R=Record, Q=Quit)", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 1)

    # Prediction box at bottom
    if predictions:
        top = predictions[0]
        conf = top['confidence']

        if conf >= THRESHOLD:
            # Background box
            box_h = 130
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, h - box_h), (w, h), (10, 15, 30), -1)
            cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)

            # Word
            word_size = cv2.getTextSize(top['word'], cv2.FONT_HERSHEY_SIMPLEX, 2.0, 3)[0]
            word_x = (w - word_size[0]) // 2
            cv2.putText(frame, top['word'], (word_x, h - 75),
                        cv2.FONT_HERSHEY_SIMPLEX, 2.0, (0, 220, 255), 3)

            # Confidence bar
            bar_color = (0, 200, 80) if conf > 0.80 else (0, 160, 255) if conf > 0.65 else (0, 80, 255)
            bar_filled = int(conf * (w - 40))
            cv2.rectangle(frame, (20, h - 50), (w - 20, h - 32), (50, 50, 50), -1)
            cv2.rectangle(frame, (20, h - 50), (20 + bar_filled, h - 32), bar_color, -1)
            cv2.putText(frame, f"Confidence: {conf:.1%}", (20, h - 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

            # Top 3 alternatives (smaller)
            for i, alt in enumerate(predictions[1:3]):
                cv2.putText(
                    frame,
                    f"  {i + 2}. {alt['word']}  {alt['confidence']:.0%}",
                    (20, h - box_h + 20 + i * 22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (120, 120, 120), 1
                )
        else:
            cv2.putText(frame, f"Low confidence: {conf:.1%} — try again",
                        (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 80, 255), 2)

    return frame


def run_live_test():
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    frame_buffer = deque(maxlen=FRAMES)
    is_recording = False
    record_start = False
    predictions = []
    last_prediction_time = 0

    print("\n  Controls:")
    print("  R = Start/stop manual recording")
    print("  Q or ESC = Quit")
    print("  Auto-prediction: shows result after every 30-frame window\n")

    with mp_hands.Hands(
        max_num_hands=1,
        model_complexity=1,
        min_detection_confidence=0.65,
        min_tracking_confidence=0.55
    ) as hands:

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)

            # Draw hand skeleton
            if results.multi_hand_landmarks:
                mp_draw.draw_landmarks(
                    frame,
                    results.multi_hand_landmarks[0],
                    mp_hands.HAND_CONNECTIONS,
                    mp_styles.get_default_hand_landmarks_style(),
                    mp_styles.get_default_hand_connections_style()
                )

            lm = get_landmarks(results)

            if is_recording:
                frame_buffer.append(lm)
                if len(frame_buffer) == FRAMES:
                    seq = np.array(frame_buffer)
                    predictions = predict_sequence(seq)
                    is_recording = False
                    frame_buffer.clear()
                    top = predictions[0]
                    print(f"  🤟 Prediction: {top['word']} ({top['confidence']:.1%})")
            else:
                # Sliding window: auto predict every 30 frames of hand presence
                if results.multi_hand_landmarks:
                    frame_buffer.append(lm)
                    if len(frame_buffer) == FRAMES:
                        now = time.time()
                        if now - last_prediction_time > 1.0:  # Max 1 prediction/sec
                            seq = np.array(frame_buffer)
                            predictions = predict_sequence(seq)
                            last_prediction_time = now
                            top = predictions[0]
                            if top['confidence'] >= THRESHOLD:
                                print(f"  🤟 Auto: {top['word']} ({top['confidence']:.1%})")
                        # Slide window by 10 frames
                        for _ in range(10):
                            if frame_buffer:
                                frame_buffer.popleft()

            frame = draw_prediction(frame, predictions, is_recording, len(frame_buffer))
            cv2.imshow("EchoSign Live Test", frame)

            key = cv2.waitKey(33) & 0xFF
            if key in [ord('q'), 27]:
                break
            elif key == ord('r'):
                frame_buffer.clear()
                is_recording = True
                print("  ● Recording 30 frames... perform your sign now!")

    cap.release()
    cv2.destroyAllWindows()
    print("\n  Test session ended.")


if __name__ == "__main__":
    run_live_test()
