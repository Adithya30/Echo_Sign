import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import TensorBoard, EarlyStopping
from sklearn.model_selection import train_test_split
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_DIR = Path('d:/Downloads/echosign-ai-main/echosign-ai-main/backend/ai_model')

def train_model():
    X_path = MODEL_DIR / 'lstm_X.npy'
    y_path = MODEL_DIR / 'lstm_y.npy'
    
    if not X_path.exists() or not y_path.exists():
        logger.error("Dataset not found. Run extract_features.py first.")
        return
        
    X = np.load(X_path)
    y = np.load(y_path)
    
    # --- DATA AUGMENTATION (Balances heavily skewed classes) ---
    class_counts = np.sum(y, axis=0)
    max_count = int(np.max(class_counts))
    target_count = max(max_count, 15) * 6  # Multiply dataset for better LSTM learning

    X_aug, y_aug = [], []
    for i in range(len(y)):
        cls = np.argmax(y[i])
        count = class_counts[cls]
        
        # Always append original
        X_aug.append(X[i])
        y_aug.append(y[i])
        
        # Generate needed synthetic copies with Noise Jittering
        needed = int(target_count / count) - 1
        for _ in range(needed):
            # 0.02 jitter effectively shifts landmarks slightly representing slight angle/position changes
            noise = np.random.normal(0, 0.02, X[i].shape)
            X_aug.append(X[i] + noise)
            y_aug.append(y[i])

    X_aug = np.array(X_aug)
    y_aug = np.array(y_aug)
    
    X_train, X_test, y_train, y_test = train_test_split(X_aug, y_aug, test_size=0.15, random_state=42)
    
    logger.info(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
    
    # Model
    model = Sequential()
    model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(30, 63)))
    model.add(LSTM(128, return_sequences=True, activation='relu'))
    model.add(LSTM(64, return_sequences=False, activation='relu'))
    model.add(Dense(64, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(y.shape[1], activation='softmax'))
    
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])
    
    # Callbacks
    tb_callback = TensorBoard(log_dir=str(MODEL_DIR / 'logs'))
    early_stop = EarlyStopping(monitor='loss', patience=20, restore_best_weights=True)
    
    # Fit
    logger.info("Starting training...")
    model.fit(X_train, y_train, epochs=200, callbacks=[tb_callback, early_stop])
    
    # Evaluate
    loss, accuracy = model.evaluate(X_test, y_test)
    logger.info(f"Test Loss: {loss:.4f}, Test Accuracy: {accuracy:.4f}")
    
    # Save
    save_path = MODEL_DIR / 'lstm_action_model.h5'
    model.save(str(save_path))
    logger.info(f"✅ Model saved to {save_path}")

if __name__ == '__main__':
    train_model()
