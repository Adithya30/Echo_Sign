from django.urls import path
from . import views

urlpatterns = [
    # Translation endpoints
    path('translate/', views.TranslateView.as_view(), name='translate'),
    path('history/', views.TranslationHistoryView.as_view(), name='history'),
    path('history/<uuid:pk>/', views.TranslationHistoryDetailView.as_view(), name='history-detail'),
    path('history/clear/', views.ClearHistoryView.as_view(), name='history-clear'),

    # Emergency endpoints
    path('emergency/', views.EmergencyAlertView.as_view(), name='emergency'),
    path('emergency/<uuid:pk>/acknowledge/', views.AcknowledgeAlertView.as_view(), name='emergency-acknowledge'),

    # WhatsApp endpoints
    path('contacts/', views.WhatsAppContactView.as_view(), name='contacts'),
    path('contacts/<uuid:pk>/', views.WhatsAppContactDetailView.as_view(), name='contact-detail'),
    path('whatsapp/send/', views.SendWhatsAppView.as_view(), name='whatsapp-send'),

    # Dashboard stats
    path('stats/', views.StatsView.as_view(), name='stats'),

    # TTS
    path('speak/', views.SpeakView.as_view(), name='speak'),

    # Health check
    path('health/', views.HealthCheckView.as_view(), name='health'),
    path('stats/global/', views.GlobalStatsView.as_view(), name='global_stats'),
    path('audit-logs/', views.AuditLogView.as_view(), name='audit_logs'),
    path('chat/history/', views.ChatHistoryView.as_view(), name='chat_history'),
]
