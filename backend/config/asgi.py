"""
ASGI config for the project.
Exposes the ASGI application with HTTP + WebSocket routing.
"""
import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Inicializa o Django antes de importar qualquer app
django_asgi_app = get_asgi_application()

# Import após django.setup() (feito por get_asgi_application)
from apps.game.realtime.routing import websocket_urlpatterns  # noqa: E402


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": URLRouter(websocket_urlpatterns),
    }
)
