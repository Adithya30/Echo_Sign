"""
Emergency Detection and Alert Service
"""

import logging
from django.conf import settings

logger = logging.getLogger(__name__)

EMERGENCY_KEYWORDS = ['HELP', 'DOCTOR', 'EMERGENCY', 'DANGER', 'POLICE', 'FIRE', 'AMBULANCE']


class EmergencyService:
    """Handles emergency alert logic when emergency signs are detected."""

    def __init__(self):
        self.tts = None
        self.whatsapp = None

    def _get_services(self):
        """Lazy import to avoid circular dependencies."""
        if self.tts is None:
            from services.tts_service import TTSService
            from services.whatsapp_service import WhatsAppService
            self.tts = TTSService()
            self.whatsapp = WhatsAppService()

    def is_emergency(self, word: str) -> bool:
        return word.upper() in EMERGENCY_KEYWORDS

    def trigger_emergency(self, word: str, confidence: float, session_id: str = 'unknown', target_lang: str = 'en'):
        """
        Full emergency response:
        1. Save alert to DB
        2. Speak via TTS
        3. Send WhatsApp to emergency contacts
        """
        self._get_services()

        logger.warning(f"🚨 EMERGENCY DETECTED: {word} (confidence: {confidence:.1%}) session: {session_id}")

        # 1. Log to database
        try:
            from translator.models import EmergencyAlert, WhatsAppContact
            import django
            django.setup()
            alert = EmergencyAlert.objects.create(
                alert_type=word.upper() if word.upper() in [c[0] for c in EmergencyAlert.ALERT_TYPES] else 'OTHER',
                message=f"Emergency sign '{word}' detected with {confidence:.1%} confidence.",
                confidence=confidence,
                status='ACTIVE'
            )
            logger.info(f"Emergency alert saved: {alert.id}")

            # 2. TTS alert (Translate if requested)
            from translator.utils import get_full_translation
            display_word = get_full_translation(word, target_lang)
            self.tts.speak(f"Emergency! {display_word} detected! Please respond immediately!", emergency=True)

            # 3. Send to emergency contacts
            translated_word = display_word if target_lang != 'en' else word.upper()
            emergency_contacts = WhatsAppContact.objects.filter(
                is_emergency_contact=True,
                is_active=True
            )
            for contact in emergency_contacts:
                logger.info(f"⏳ Attempting to send WhatsApp alert to {contact.name} ({contact.phone_number})...")
                result = self.whatsapp.send_emergency_message(
                    contact.phone_number, translated_word, display_word
                )
                if result.get('success'):
                    alert.whatsapp_sent = True
                    alert.save()
                    logger.info(f"✅ SUCCESS: WA alert sent to {contact.name}")
                else:
                    error_msg = result.get('error', 'Unknown Error')
                    logger.error(f"❌ FAILED: WA alert to {contact.name} failed: {error_msg}")

        except Exception as e:
            logger.error(f"Emergency handling error: {e}")
            # At minimum, announce via TTS even if DB fails
            try:
                self.tts.speak(f"Emergency! {word}! Please help!", emergency=True)
            except Exception:
                pass
