from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from chat import consumers

application = ProtocolTypeRouter(
    {
        "websocket": URLRouter(
            [path("ws/chat/", consumers.ChatConsumer.as_asgi())]
        ),
    }
)
