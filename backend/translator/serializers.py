from rest_framework import serializers
from .models import TranslationHistory, EmergencyAlert, WhatsAppContact, UserSession


class TranslationHistorySerializer(serializers.ModelSerializer):
    confidence_percent = serializers.SerializerMethodField()

    class Meta:
        model = TranslationHistory
        fields = '__all__'

    def get_confidence_percent(self, obj):
        return round(obj.confidence * 100, 1)


class EmergencyAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyAlert
        fields = '__all__'


class WhatsAppContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppContact
        fields = '__all__'


class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = '__all__'


class TranslateRequestSerializer(serializers.Serializer):
    landmarks = serializers.JSONField(
        help_text="Single frame 21 landmarks, OR an array of 30 frames"
    )
    session_id = serializers.CharField(required=False, default='default')
    target_lang = serializers.CharField(required=False, default='en')


class StatsSerializer(serializers.Serializer):
    total_translations = serializers.IntegerField()
    today_translations = serializers.IntegerField()
    emergency_alerts = serializers.IntegerField()
    avg_confidence = serializers.FloatField()
    top_words = serializers.ListField()
    recent_activity = serializers.ListField()
