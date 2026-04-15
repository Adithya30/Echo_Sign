import os
import cv2
import json
import numpy as np
import mediapipe as mp
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
DATASET_PATH = Path('d:/Downloads/echosign-ai-main/echosign-ai-main/AI_trainer')
WLASL_JSON = DATASET_PATH / 'WLASL_v0.3.json'
VIDEOS_DIR = DATASET_PATH / 'videos'
OUTPUT_DIR = Path('d:/Downloads/echosign-ai-main/echosign-ai-main/backend/ai_model')

TARGET_WORDS = ["hello", "thank you", "thankyou", "go", "come", "drink", "eat", "yes", "no"]
SEQUENCE_LENGTH = 30
FEATURE_SIZE = 63  # 21 landmarks * 3 coordinates

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.5)

def normalize_landmarks(landmarks):
    features = []
    for lm in landmarks:
        features.extend([lm.x, lm.y, lm.z])
    
    # Normalize to wrist (0,0,0) and scale
    arr = np.array(features, dtype=np.float32).reshape(21, 3)
    wrist = arr[0].copy()
    arr -= wrist
    max_dist = np.max(np.abs(arr)) + 1e-8
    arr /= max_dist
    return np.clip(arr.flatten(), -1.0, 1.0)


def extract_features_from_video(video_path):
    cap = cv2.VideoCapture(str(video_path))
    frames_features = []
    
    if not cap.isOpened():
        return None

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)
        
        if results.multi_hand_landmarks:
            # Use the first valid hand
            lm = results.multi_hand_landmarks[0].landmark
            features = normalize_landmarks(lm)
            frames_features.append(features)
        else:
            # Pad with zeros
            frames_features.append(np.zeros(FEATURE_SIZE, dtype=np.float32))
            
    cap.release()
    
    if len(frames_features) == 0:
        return None
        
    # Standardize length to SEQUENCE_LENGTH
    seq = np.array(frames_features)
    if len(seq) > SEQUENCE_LENGTH:
        # Truncate
        np.random.seed(42)  # Optional: center crop or random crop
        start = (len(seq) - SEQUENCE_LENGTH) // 2
        seq = seq[start:start + SEQUENCE_LENGTH]
    elif len(seq) < SEQUENCE_LENGTH:
        # Pad at the end with zeros or repeat last frame
        pad_len = SEQUENCE_LENGTH - len(seq)
        padding = np.zeros((pad_len, FEATURE_SIZE), dtype=np.float32)
        seq = np.vstack((seq, padding))
        
    return seq

def main():
    if not WLASL_JSON.exists():
        logger.error(f"WLASL JSON not found: {WLASL_JSON}")
        return

    with open(WLASL_JSON, 'r') as f:
        wlasl_data = json.load(f)
        
    # Map words to canonical labels
    label_map = {}
    actual_labels = ["Hello", "Thank You", "Go", "Come", "Drink", "Eat", "Yes", "No"]
    
    sequences, labels = [], []
    video_count = 0
    
    # Process
    for entry in wlasl_data:
        word = entry['gloss'].lower()
        if word in TARGET_WORDS:
            canonical_word = "Thank You" if "thank" in word else word.capitalize()
            
            if canonical_word not in label_map:
                label_map[canonical_word] = len(label_map)
                
            class_idx = label_map[canonical_word]
            
            for inst in entry['instances']:
                video_file = f"{inst['video_id']}.mp4"
                video_path = VIDEOS_DIR / video_file
                if video_path.exists():
                    logger.info(f"Processing {canonical_word} -> {video_file}...")
                    seq = extract_features_from_video(video_path)
                    if seq is not None:
                        sequences.append(seq)
                        labels.append(class_idx)
                        video_count += 1
                        
    if video_count == 0:
        logger.error("No valid videos found.")
        return
        
    X = np.array(sequences)
    y = to_categorical(labels).astype(int)
    
    logger.info(f"Extracted sequences shape: {X.shape}")
    logger.info(f"Labels shape: {y.shape}")
    
    # Save datasets
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    np.save(OUTPUT_DIR / 'lstm_X.npy', X)
    np.save(OUTPUT_DIR / 'lstm_y.npy', y)
    
    # Save label map inverted
    inv_map = {idx: name for name, idx in label_map.items()}
    final_labels = [inv_map[i] for i in range(len(label_map))]
    
    with open(OUTPUT_DIR / 'lstm_labels.json', 'w') as f:
        json.dump(final_labels, f, indent=4)
        
    logger.info(f"✅ Extraction complete! Map: {final_labels}")

if __name__ == '__main__':
    main()
