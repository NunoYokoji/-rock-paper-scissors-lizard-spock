from django.urls import path

from apps.game.api import views

urlpatterns = [
    path("rules", views.rules, name="rules"),
    path("matches", views.create_match, name="create-match"),
    path("matches/join", views.join_match, name="join-match"),
    path("leaderboard", views.leaderboard, name="leaderboard"),
    path("nicknames/check", views.check_nickname, name="check-nickname"),
]
