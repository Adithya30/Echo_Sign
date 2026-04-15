from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/translate/$', consumers.TranslationConsumer.as_asgi()),
    re_path(r'ws/emergency/$', consumers.EmergencyConsumer.as_asgi()),
    re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/notify/$', consumers.NotificationConsumer.as_asgi()),
]
