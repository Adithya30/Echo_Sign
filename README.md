# 🤟 EchoSign AI Translator

A real-time sign language translation system powered by AI.

## 🚀 Quick Start

### 1. Backend (Django)
```powershell
cd backend
python manage.py migrate
python manage.py createsuperuser  # optional admin access
python manage.py runserver
```
Backend API runs at: http://127.0.0.1:8000

### 2. Frontend (React)
```powershell
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

---

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Computer Vision | MediaPipe Hands |
| AI Model | LSTM (TensorFlow/Keras) |
| Backend | Django + DRF + Channels |
| Frontend | React + Vite |
| TTS | pyttsx3 (offline) + Browser SpeechSynthesis |
| Messaging | pywhatkit (WhatsApp Web) |
| Database | SQLite |

## 📡 API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/translate/ | Translate landmark data → sign word |
| GET | /api/history/ | Fetch translation history |
| GET | /api/stats/ | Dashboard statistics |
| POST | /api/emergency/ | Trigger emergency alert |
| GET | /api/contacts/ | WhatsApp contacts |
| POST | /api/whatsapp/send/ | Send WhatsApp message |
| POST | /api/speak/ | Text-to-speech |
| GET | /api/health/ | System health check |

## 🎯 Features
- ✅ Real-time webcam hand detection (MediaPipe)
- ✅ LSTM gesture recognition (30+ signs)
- ✅ Offline TTS via pyttsx3
- ✅ Emergency alert system (HELP, DOCTOR, FIRE, etc.)
- ✅ WhatsApp message automation
- ✅ Translation history with charts
- ✅ Dark glassmorphism UI

## 📝 Notes
- The demo LSTM model uses heuristic-based predictions. For accurate recognition, train the model with real gesture data using `ai_model/model_trainer.py`.
- WhatsApp messaging requires being logged into WhatsApp Web in your browser.
- TTS works fully offline using pyttsx3.
