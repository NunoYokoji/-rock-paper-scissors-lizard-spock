"""Views do app players — login por apelido e retomada de sessão."""
import hashlib
import re
import uuid

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.players.models import Player

NICKNAME_REGEX = re.compile(r"^[a-zA-Z0-9_]{3,20}$")


@api_view(["POST"])
@permission_classes([AllowAny])
def guest_login(request):
    """
    POST /api/auth/guest  { "nickname": "spock_42" }
    Cria o jogador e devolve { player, token }.
    """
    nickname = (request.data.get("nickname") or "").strip()
    if not NICKNAME_REGEX.match(nickname):
        return Response(
            {"error": "Apelido deve ter 3–20 caracteres (letras, números, _)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Player.objects.filter(nickname__iexact=nickname).exists():
        return Response(
            {"error": "Esse apelido já está em uso."},
            status=status.HTTP_409_CONFLICT,
        )

    token = uuid.uuid4().hex
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    player = Player.objects.create(
        nickname=nickname,
        token_hash=token_hash,
    )

    return Response(
        {
            "player": {
                "id": str(player.id),
                "nickname": player.nickname,
            },
            "token": token,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    GET /api/auth/me
    Retoma a sessão pelo token.
    """
    player = request.user
    return Response(
        {
            "id": str(player.id),
            "nickname": player.nickname,
            "wins": player.wins,
            "losses": player.losses,
            "draws": player.draws,
            "matches_played": player.matches_played,
        }
    )
