from django.urls import path
from . import views
from .consumers import ChatConsumer

urlpatterns = [
    path('', views.index, name='index'),
    path('ws/chat/', ChatConsumer.as_asgi(), name='chat_ws'),
]