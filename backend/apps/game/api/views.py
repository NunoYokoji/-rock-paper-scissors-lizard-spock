"""Views da API REST do jogo."""
import random
import string

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.game.domain.rules import MOVE_INFO, RULES_ORDER, Move
from apps.game.models import Match
from apps.players.models import Player


@api_view(["GET"])
@permission_classes([AllowAny])
def rules(request):
    """
    GET /api/rules
    Devolve as jogadas e as 10 regras na ordem clássica. Resposta cacheável.
    """
    moves = [
        {"id": m.value, "label": MOVE_INFO[m]["label"], "icon": MOVE_INFO[m]["icon"]}
        for m in Move
    ]
    rules_list = [
        {
            "order": i + 1,
            "winner": winner.value,
            "verb": verb,
            "loser": loser.value,
        }
        for i, (winner, verb, loser) in enumerate(RULES_ORDER)
    ]
    return Response({"moves": moves, "rules": rules_list})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_match(request):
    """
    POST /api/matches  { "mode": "quick"|"private"|"bot", "best_of": 3|5 }
    Cria uma partida.
    """
    player = request.user
    mode = request.data.get("mode", "quick")
    best_of = request.data.get("best_of", 3)

    if mode not in ("quick", "private", "bot"):
        return Response(
            {"error": "Modo inválido. Use quick, private ou bot."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if best_of not in (3, 5):
        return Response(
            {"error": "best_of deve ser 3 ou 5."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Matchmaking rápido: procura partida esperando oponente
    if mode == "quick":
        waiting = (
            Match.objects.filter(
                status=Match.Status.WAITING,
                mode=Match.Mode.QUICK,
                best_of=best_of,
            )
            .exclude(player_one=player)
            .select_for_update()
            .first()
        )
        if waiting:
            waiting.player_two = player
            waiting.status = Match.Status.PLAYING
            waiting.save()
            return Response(
                _match_to_dict(waiting), status=status.HTTP_200_OK
            )

    code = None
    if mode == "private":
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

    match = Match.objects.create(
        player_one=player,
        mode=mode,
        best_of=best_of,
        code=code,
        status=Match.Status.WAITING if mode != "bot" else Match.Status.PLAYING,
    )

    return Response(
        _match_to_dict(match), status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_match(request):
    """
    POST /api/matches/join  { "code": "ABC123" }
    Entra numa sala privada.
    """
    player = request.user
    code = (request.data.get("code") or "").strip().upper()

    if not code or len(code) != 6:
        return Response(
            {"error": "Código deve ter 6 caracteres."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        match = Match.objects.select_for_update().get(
            code=code,
            status=Match.Status.WAITING,
            mode=Match.Mode.PRIVATE,
        )
    except Match.DoesNotExist:
        return Response(
            {"error": "Sala não encontrada — confira o código ou crie uma nova."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if match.player_one == player:
        return Response(
            {"error": "Você já está nesta sala."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    match.player_two = player
    match.status = Match.Status.PLAYING
    match.save()

    return Response(_match_to_dict(match), status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def leaderboard(request):
    """
    GET /api/leaderboard
    Lê os top jogadores ordenados por vitórias.
    """
    players = (
        Player.objects.filter(matches_played__gt=0)
        .order_by("-wins")
        .values(
            "id", "nickname", "wins", "losses", "draws", "matches_played"
        )[:50]
    )
    results = []
    for p in players:
        mp = p["matches_played"]
        win_rate = round(100.0 * p["wins"] / mp, 1) if mp > 0 else 0
        p["win_rate"] = win_rate
        p["id"] = str(p["id"])
        results.append(p)
    return Response(results)


@api_view(["GET"])
@permission_classes([AllowAny])
def check_nickname(request):
    """
    GET /api/nicknames/check?q=spock
    Verifica disponibilidade de apelido.
    """
    q = (request.query_params.get("q") or "").strip()
    if not q:
        return Response({"available": False, "suggestion": None})

    available = not Player.objects.filter(nickname__iexact=q).exists()
    suggestion = None
    if not available:
        # Sugere variações
        for _ in range(10):
            candidate = f"{q}_{random.randint(1, 999)}"
            if not Player.objects.filter(nickname__iexact=candidate).exists():
                suggestion = candidate
                break

    return Response({"available": available, "suggestion": suggestion})


def _match_to_dict(match: Match) -> dict:
    """Serializa uma partida para JSON."""
    return {
        "id": str(match.id),
        "code": match.code,
        "mode": match.mode,
        "best_of": match.best_of,
        "status": match.status,
        "player_one": {
            "id": str(match.player_one.id),
            "nickname": match.player_one.nickname,
        },
        "player_two": (
            {
                "id": str(match.player_two.id),
                "nickname": match.player_two.nickname,
            }
            if match.player_two
            else None
        ),
        "winner": str(match.winner_id) if match.winner_id else None,
        "created_at": match.created_at.isoformat() if match.created_at else None,
    }
