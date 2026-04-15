import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from translator.middleware import JWTQueryStringAuthMiddleware
import translator.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'echosign.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        JWTQueryStringAuthMiddleware(
            URLRouter(
                translator.routing.websocket_urlpatterns
            )
        )
    ),
})
