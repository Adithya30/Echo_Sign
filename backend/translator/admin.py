from django.contrib import admin
from .models import TranslationHistory, EmergencyAlert, WhatsAppContact, UserSession


@admin.register(TranslationHistory)
class TranslationHistoryAdmin(admin.ModelAdmin):
    list_display = ['word', 'confidence', 'is_emergency', 'session_id', 'timestamp']
    list_filter = ['is_emergency', 'timestamp']
    search_fields = ['word', 'session_id']
    readonly_fields = ['id', 'timestamp']
    ordering = ['-timestamp']


@admin.register(EmergencyAlert)
class EmergencyAlertAdmin(admin.ModelAdmin):
    list_display = ['alert_type', 'message', 'status', 'confidence', 'timestamp']
    list_filter = ['alert_type', 'status']
    search_fields = ['message']
    readonly_fields = ['id', 'timestamp']


@admin.register(WhatsAppContact)
class WhatsAppContactAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone_number', 'is_active', 'is_emergency_contact', 'created_at']
    list_filter = ['is_active', 'is_emergency_contact']
    search_fields = ['name', 'phone_number']


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'total_translations', 'emergency_count', 'start_time']
    readonly_fields = ['start_time']
