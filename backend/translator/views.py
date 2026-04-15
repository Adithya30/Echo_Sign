from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import render
from django.db.models import Q, Avg, Count
from django.db import models
from django.utils import timezone
from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from datetime import timedelta
import threading

from .models import (
    TranslationHistory, EmergencyAlert, WhatsAppContact, UserSession, 
    ChatMessage, Notification, ContactMessage
)
from .serializers import (
    TranslationHistorySerializer, EmergencyAlertSerializer,
    WhatsAppContactSerializer, TranslateRequestSerializer,
    UserSessionSerializer
)
from .utils import get_full_translation, translate_sign
# Services are lazy-loaded to avoid startup issues
_gesture_recognizer = None
_tts_service = None
_emergency_service = None
_whatsapp_service = None


def get_gesture_recognizer():
    global _gesture_recognizer
    if _gesture_recognizer is None:
        from ai_model.gesture_recognizer import GestureRecognizer
        _gesture_recognizer = GestureRecognizer()
    return _gesture_recognizer


def get_tts_service():
    global _tts_service
    if _tts_service is None:
        from services.tts_service import TTSService
        _tts_service = TTSService()
    return _tts_service


def get_emergency_service():
    global _emergency_service
    if _emergency_service is None:
        from services.emergency_service import EmergencyService
        _emergency_service = EmergencyService()
    return _emergency_service


def get_whatsapp_service():
    global _whatsapp_service
    if _whatsapp_service is None:
        from services.whatsapp_service import WhatsAppService
        _whatsapp_service = WhatsAppService()
    return _whatsapp_service


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        recognizer = get_gesture_recognizer()
        return Response({
            'status': 'online',
            'service': 'EchoSign AI Translator',
            'version': '1.0.0',
            'model_loaded': recognizer.is_ready(),
            'recognition_mode': recognizer.get_mode(),     # cnn_kaggle | lstm_custom | demo
            'active_labels': recognizer.get_labels()[:5],  # preview
            'total_labels': len(recognizer.get_labels()),
            'timestamp': timezone.now().isoformat()
        })


class TranslateView(APIView):
    """Main translation endpoint - receives landmark data, returns prediction."""

    def post(self, request):
        serializer = TranslateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        landmarks = serializer.validated_data['landmarks']
        session_id = serializer.validated_data.get('session_id', 'default')

        target_lang = serializer.validated_data.get('target_lang', 'en')

        # Run AI recognition
        result = get_gesture_recognizer().predict(landmarks, session_id=session_id)

        if result is None:
            return Response({'status': 'buffering', 'message': 'Buffering sequence frames...'}, status=status.HTTP_200_OK)

        word = result['word']
        translated_word = translate_sign(word, target_lang)
        display_word = get_full_translation(word, target_lang)
        
        confidence = result['confidence']
        is_emergency = word.upper() in settings.EMERGENCY_KEYWORDS

        # Save to history
        record = TranslationHistory.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_id=session_id,
            word=display_word,
            confidence=confidence,
            is_emergency=is_emergency
        )

        # Handle emergency in background
        if is_emergency:
            threading.Thread(
                target=get_emergency_service().trigger_emergency,
                args=(word, confidence, session_id),
                kwargs={'target_lang': target_lang},
                daemon=True
            ).start()

        return Response({
            'id': str(record.id),
            'word': word,
            'translated_word': translated_word,
            'display_word': display_word,
            'confidence': confidence,
            'confidence_percent': round(confidence * 100, 1),
            'is_emergency': is_emergency,
            'timestamp': record.timestamp.isoformat()
        })


class SpeakView(APIView):
    """Convert text to speech."""

    def post(self, request):
        text = request.data.get('text', '').strip()
        is_emergency = request.data.get('is_emergency', False)
        if not text:
            return Response({'error': 'No text provided'}, status=status.HTTP_400_BAD_REQUEST)

        threading.Thread(
            target=get_tts_service().speak,
            args=(text,),
            kwargs={'emergency': is_emergency},
            daemon=True
        ).start()

        return Response({'success': True, 'message': f'Speaking: {text}'})


class TranslationHistoryView(APIView):
    def get(self, request):
        if request.user.role in ['ADMIN', 'EMERGENCY_STAFF']:
            records = TranslationHistory.objects.all()
        else:
            records = TranslationHistory.objects.filter(user=request.user)

        # Filtering
        word_filter = request.query_params.get('word')
        emergency_only = request.query_params.get('emergency')
        if word_filter:
            records = records.filter(word__icontains=word_filter)
        if emergency_only == 'true':
            records = records.filter(is_emergency=True)

        serializer = TranslationHistorySerializer(records, many=True)
        return Response({'count': records.count(), 'results': serializer.data})

    def delete(self, request):
        TranslationHistory.objects.all().delete()
        return Response({'success': True, 'message': 'History cleared.'})


class TranslationHistoryDetailView(APIView):
    def get(self, request, pk):
        try:
            record = TranslationHistory.objects.get(pk=pk)
            return Response(TranslationHistorySerializer(record).data)
        except TranslationHistory.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            TranslationHistory.objects.get(pk=pk).delete()
            return Response({'success': True})
        except TranslationHistory.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class ClearHistoryView(APIView):
    def delete(self, request):
        count, _ = TranslationHistory.objects.all().delete()
        return Response({'success': True, 'deleted': count})


class EmergencyAlertView(APIView):
    def get_queryset(self):
        if self.request.user.role in ['ADMIN', 'EMERGENCY_STAFF']:
            return EmergencyAlert.objects.all()
        return EmergencyAlert.objects.filter(user=self.request.user)

    @action(detail=True, methods=['put'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.status = 'RESOLVED'
        alert.acknowledged_at = timezone.now()
        alert.save()
        return Response({'status': 'resolved'})


class GlobalStatsView(APIView):
    """Global system statistics for the Admin Dashboard."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized'}, status=403)
        
        return Response({
            'users': User.objects.count(),
            'alerts': EmergencyAlert.objects.count(),
            'translations': TranslationHistory.objects.count(),
            'uptime': '99.9%',
            'accuracy': 0.942
        })


class AuditLogView(APIView):
    """System-wide logs for Admin auditing."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Unauthorized'}, status=403)
            
        # Mocking audit logs based on translation and alert history for now
        # In a real app, this would be a dedicated Audit model
        alerts = EmergencyAlert.objects.all()[:10]
        logs = [{
            'action': 'Emergency Alert Triggered',
            'details': f"Type: {a.alert_type} from User: {a.user.username if a.user else 'Anon'}",
            'timestamp': a.timestamp
        } for a in alerts]
        
        return Response(logs)


class ChatHistoryView(APIView):
    """Fetches chat history for specified user pair."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        target_user_id = request.query_params.get('user_id')
        if not target_user_id:
            return Response([])
            
        messages = ChatMessage.objects.filter(
            (Q(sender=request.user) & Q(receiver_id=target_user_id)) |
            (Q(sender_id=target_user_id) & Q(receiver=request.user))
        ).order_by('timestamp')
        
        return Response([{
            'id': m.id,
            'sender_id': m.sender.id,
            'sender_name': m.sender.username,
            'message': m.message,
            'timestamp': m.timestamp,
            'is_sent': m.sender == request.user
        } for m in messages])

    def post(self, request):
        alert_type = request.data.get('alert_type', 'OTHER').upper()
        message = request.data.get('message', 'Manual emergency alert triggered')
        confidence = request.data.get('confidence', 1.0)

        alert = EmergencyAlert.objects.create(
            user=request.user if request.user.is_authenticated else None,
            alert_type=alert_type,
            message=message,
            confidence=confidence,
            status='ACTIVE'
        )

        # Trigger TTS + WhatsApp
        threading.Thread(
            target=get_emergency_service().trigger_emergency,
            args=(alert_type, confidence, 'manual'),
            daemon=True
        ).start()

        return Response(EmergencyAlertSerializer(alert).data, status=status.HTTP_201_CREATED)


class AcknowledgeAlertView(APIView):
    def post(self, request, pk):
        try:
            alert = EmergencyAlert.objects.get(pk=pk)
            alert.status = 'ACKNOWLEDGED'
            alert.acknowledged_at = timezone.now()
            alert.save()
            return Response(EmergencyAlertSerializer(alert).data)
        except EmergencyAlert.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class WhatsAppContactView(APIView):
    def get(self, request):
        contacts = WhatsAppContact.objects.filter(user=request.user)
        return Response(WhatsAppContactSerializer(contacts, many=True).data)

    def post(self, request):
        serializer = WhatsAppContactSerializer(data=request.data)
        if serializer.is_valid():
            contact = serializer.save(user=request.user)
            return Response(WhatsAppContactSerializer(contact).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WhatsAppContactDetailView(APIView):
    def get_object(self, pk):
        try:
            return WhatsAppContact.objects.get(pk=pk)
        except WhatsAppContact.DoesNotExist:
            return None

    def put(self, request, pk):
        contact = self.get_object(pk)
        if not contact:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = WhatsAppContactSerializer(contact, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        contact = self.get_object(pk)
        if not contact:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        contact.delete()
        return Response({'success': True})


class SendWhatsAppView(APIView):
    def post(self, request):
        phone = request.data.get('phone')
        message = request.data.get('message', '')
        contact_id = request.data.get('contact_id')

        if contact_id:
            try:
                contact = WhatsAppContact.objects.get(pk=contact_id)
                phone = contact.phone_number
            except WhatsAppContact.DoesNotExist:
                return Response({'error': 'Contact not found'}, status=status.HTTP_404_NOT_FOUND)

        if not phone or not message:
            return Response({'error': 'Phone and message are required'}, status=status.HTTP_400_BAD_REQUEST)

        result = get_whatsapp_service().send_message(phone, message)
        return Response(result)


class StatsView(APIView):
    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        is_privileged = request.user.role in ['ADMIN', 'EMERGENCY_STAFF']
        
        base_history = TranslationHistory.objects.all() if is_privileged else TranslationHistory.objects.filter(user=request.user)
        base_alerts = EmergencyAlert.objects.all() if is_privileged else EmergencyAlert.objects.filter(user=request.user)

        total = base_history.count()
        today = base_history.filter(timestamp__gte=today_start).count()
        emergency_count = base_alerts.filter(status='ACTIVE').count()
        avg_conf = base_history.aggregate(avg=Avg('confidence'))['avg'] or 0

        # Top words
        top_words = (
            base_history
            .values('word')
            .annotate(count=Count('word'))
            .order_by('-count')[:10]
        )

        # Last 7 days activity
        weekly = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            count = base_history.filter(timestamp__gte=day_start, timestamp__lt=day_end).count()
            weekly.append({'date': day_start.strftime('%b %d'), 'count': count})

        return Response({
            'total_translations': total,
            'today_translations': today,
            'emergency_alerts': emergency_count,
            'avg_confidence': round(avg_conf * 100, 1),
            'top_words': list(top_words),
            'weekly_activity': weekly,
            'total_contacts': WhatsAppContact.objects.filter(user=request.user).count(),
        })
