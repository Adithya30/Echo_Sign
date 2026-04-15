"""
WhatsApp Messaging Service using pywhatkit
"""

import logging
import time
from datetime import datetime

logger = logging.getLogger(__name__)

# WhatsApp integration disabled per user request
WHATSAPP_AVAILABLE = False
logger.warning("WhatsApp disabled manually. Messages will be simulated.")


class WhatsAppService:
    """WhatsApp messaging via pywhatkit (opens WhatsApp Web)."""

    def send_message(self, phone_number: str, message: str) -> dict:
        """
        Send a WhatsApp message to the given phone number.
        
        Args:
            phone_number: E.164 format (+91XXXXXXXXXX)
            message: Message text
            
        Returns:
            dict with success status
        """
        if not phone_number or not message:
            return {'success': False, 'error': 'Phone number and message are required'}

        # Normalize phone number
        phone = phone_number.strip()
        if not phone.startswith('+'):
            phone = '+' + phone

        if not WHATSAPP_AVAILABLE:
            logger.info(f"[WA SIMULATED] To: {phone} | Msg: {message}")
            return {
                'success': True,
                'simulated': True,
                'message': f'WhatsApp simulated (pywhatkit not available). Would send to {phone}: {message}'
            }

        try:
            # Increase wait_time (30s) to ensure WhatsApp Web fully loads the chat before attempting the automated 'Enter' keypress.
            # tab_close is set to False to ensure you can see the result if the 'Enter' keypress fails.
            pywhatkit.sendwhatmsg_instantly(
                phone,
                f"🤟 EchoSign AI Translator\n\n{message}\n\nSent at {datetime.now().strftime('%H:%M')}",
                wait_time=30,
                tab_close=False
            )

            logger.info(f"✅ WhatsApp message triggered instantly to {phone}")
            return {
                'success': True,
                'phone': phone,
                'message': message,
                'mode': 'instant'
            }

        except Exception as e:
            logger.error(f"WhatsApp error: {e}")
            return {
                'success': False,
                'error': str(e),
                'note': 'Make sure WhatsApp Web is open and you are logged in.'
            }

    def send_emergency_message(self, phone_number: str, alert_type: str, word: str) -> dict:
        """Send emergency-formatted WhatsApp message."""
        message = (
            f"🚨 EMERGENCY ALERT 🚨\n\n"
            f"Type: {alert_type}\n"
            f"Sign Detected: {word}\n"
            f"EchoSign AI has detected an emergency signal.\n"
            f"Please respond immediately!"
        )
        return self.send_message(phone_number, message)
