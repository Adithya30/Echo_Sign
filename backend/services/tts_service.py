"""
Text-to-Speech Service using pyttsx3 (offline, no API needed)
"""

import logging
import threading

logger = logging.getLogger(__name__)

try:
    import pyttsx3
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    logger.warning("pyttsx3 not available. TTS will be disabled.")


class TTSService:
    """Offline Text-to-Speech service using pyttsx3."""

    def __init__(self):
        self._lock = threading.Lock()
        self._engine = None
        self._init_engine()

    def _init_engine(self):
        if not TTS_AVAILABLE:
            return
        try:
            self._engine = pyttsx3.init()
            self._engine.setProperty('rate', 150)
            self._engine.setProperty('volume', 0.9)
            # Try to set a clearer voice
            voices = self._engine.getProperty('voices')
            if voices:
                self._engine.setProperty('voice', voices[0].id)
            logger.info("✅ TTS engine initialized")
        except Exception as e:
            logger.error(f"TTS init error: {e}")
            self._engine = None

    def speak(self, text: str, emergency: bool = False):
        """
        Convert text to speech.
        
        Args:
            text: Text to speak
            emergency: If True, uses louder/faster settings
        """
        if not text.strip():
            return

        if not TTS_AVAILABLE or self._engine is None:
            logger.info(f"[TTS SIMULATED] Speaking: '{text}'")
            return

        with self._lock:
            try:
                if emergency:
                    self._engine.setProperty('rate', 175)
                    self._engine.setProperty('volume', 1.0)
                    speak_text = f"EMERGENCY ALERT! {text}! {text}!"
                else:
                    self._engine.setProperty('rate', 150)
                    self._engine.setProperty('volume', 0.9)
                    speak_text = text

                self._engine.say(speak_text)
                self._engine.runAndWait()
                logger.info(f"✅ TTS spoke: '{speak_text}'")
            except Exception as e:
                logger.error(f"TTS speak error: {e}")
                # Reinitialize and try once more
                self._init_engine()

    def set_rate(self, rate: int):
        if self._engine:
            self._engine.setProperty('rate', max(50, min(300, rate)))

    def set_volume(self, volume: float):
        if self._engine:
            self._engine.setProperty('volume', max(0.0, min(1.0, volume)))

    def get_voices(self):
        if not self._engine:
            return []
        voices = self._engine.getProperty('voices')
        return [{'id': v.id, 'name': v.name} for v in voices] if voices else []
