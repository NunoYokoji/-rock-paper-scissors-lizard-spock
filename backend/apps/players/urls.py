from django.urls import path

from apps.players import views

urlpatterns = [
    path("guest", views.guest_login, name="guest-login"),
    path("me", views.me, name="me"),
]
