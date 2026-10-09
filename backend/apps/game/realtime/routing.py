from django.urls import re_path

from apps.game.realtime.consumer import MatchConsumer

websocket_urlpatterns = [
    re_path(r"ws/match/(?P<match_id>[0-9a-f-]+)/$", MatchConsumer.as_asgi()),
]
