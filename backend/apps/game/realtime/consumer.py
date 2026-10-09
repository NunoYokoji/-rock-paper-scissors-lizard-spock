"""
WebSocket consumer para partidas em tempo real.
Protocolo:
  - Cliente envia: auth, move.submit, rematch.request, ping
  - Servidor envia: match.state, opponent.joined, opponent.left,
                     opponent.moved, round.result, match.finished, error
"""
import asyncio
import hashlib
import json
import random
import logging
from uuid import UUID

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction
from django.utils import timezone

from apps.game.domain.rules import Move as RulesMove, resolve, RULES_ORDER, MOVE_INFO
from apps.game.models import Match, Round, Move
from apps.players.models import Player

logger = logging.getLogger(__name__)

AUTH_TIMEOUT = 5  # segundos


class MatchConsumer(AsyncJsonWebsocketConsumer):
    """Consumer WebSocket para uma partida."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.match_id: str = ""
        self.group_name: str = ""
        self.player: Player | None = None
        self.authenticated = False
        self._auth_timer: asyncio.Task | None = None

    async def connect(self):
        self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
        self.group_name = f"match_{self.match_id}"
        await self.accept()
        # Timer: fecha conexão se não autenticar em 5s
        self._auth_timer = asyncio.ensure_future(self._auth_timeout())

    async def _auth_timeout(self):
        await asyncio.sleep(AUTH_TIMEOUT)
        if not self.authenticated:
            await self.send_json(
                {"type": "error", "code": "auth_timeout", "message": "Autenticação necessária."}
            )
            await self.close()

    async def disconnect(self, code):
        if self._auth_timer and not self._auth_timer.done():
            self._auth_timer.cancel()
        if self.authenticated:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            # Notifica oponente
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "opponent_left",
                    "player_id": str(self.player.id) if self.player else "",
                },
            )

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type", "")

        if not self.authenticated:
            if msg_type == "auth":
                await self._handle_auth(content)
            else:
                await self.send_json(
                    {"type": "error", "code": "not_authenticated", "message": "Envie auth primeiro."}
                )
            return

        handlers = {
            "move.submit": self._handle_move,
            "ping": self._handle_ping,
            "rematch.request": self._handle_rematch,
        }
        handler = handlers.get(msg_type)
        if handler:
            await handler(content)
        else:
            await self.send_json(
                {"type": "error", "code": "unknown_type", "message": f"Tipo desconhecido: {msg_type}"}
            )

    # ── Auth ───────────────────────────────────────────────────

    async def _handle_auth(self, content):
        token = content.get("token", "")
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        player = await self._get_player_by_token(token_hash)
        if not player:
            await self.send_json(
                {"type": "error", "code": "invalid_token", "message": "Token inválido."}
            )
            await self.close()
            return

        self.player = player
        self.authenticated = True
        if self._auth_timer and not self._auth_timer.done():
            self._auth_timer.cancel()

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # Envia estado completo da partida
        state = await self._get_match_state()
        await self.send_json({"type": "match.state", **state})

        # Notifica oponente
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "opponent_joined",
                "player_id": str(self.player.id),
                "nickname": self.player.nickname,
            },
        )

    # ── Move ───────────────────────────────────────────────────

    async def _handle_move(self, content):
        choice = content.get("choice", "")
        if choice not in [m.value for m in RulesMove]:
            await self.send_json(
                {"type": "error", "code": "invalid_choice", "message": f"Jogada inválida: {choice}"}
            )
            return

        result = await self._submit_move(choice)
        if result.get("error"):
            await self.send_json(
                {"type": "error", "code": result["error"], "message": result.get("message", "")}
            )
            return

        if result.get("waiting"):
            # Notifica que este jogador já jogou (sem revelar a jogada)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "opponent_moved",
                    "player_id": str(self.player.id),
                },
            )
        elif result.get("round_result"):
            # Rodada resolvida — envia resultado para todos
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "round_result",
                    **result["round_result"],
                },
            )
            if result.get("match_finished"):
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "match_finished",
                        **result["match_finished"],
                    },
                )

    async def _handle_ping(self, content):
        await self.send_json({"type": "pong"})

    async def _handle_rematch(self, content):
        # Placeholder — será implementado na iteração completa
        await self.send_json(
            {"type": "error", "code": "not_implemented", "message": "Rematch ainda não implementado."}
        )

    # ── Group message handlers (chamados pelo channel_layer) ──

    async def opponent_joined(self, event):
        if str(self.player.id) != event["player_id"]:
            await self.send_json(
                {
                    "type": "opponent.joined",
                    "player_id": event["player_id"],
                    "nickname": event["nickname"],
                }
            )

    async def opponent_left(self, event):
        if str(self.player.id) != event["player_id"]:
            await self.send_json(
                {"type": "opponent.left", "player_id": event["player_id"]}
            )

    async def opponent_moved(self, event):
        if str(self.player.id) != event["player_id"]:
            await self.send_json({"type": "opponent.moved"})

    async def round_result(self, event):
        await self.send_json(
            {
                "type": "round.result",
                "round_number": event["round_number"],
                "choices": event["choices"],
                "winner": event.get("winner"),
                "rule": event.get("rule"),
            }
        )

    async def match_finished(self, event):
        await self.send_json(
            {
                "type": "match.finished",
                "winner": event.get("winner"),
                "score": event.get("score"),
            }
        )

    # ── Database helpers ──────────────────────────────────────

    @database_sync_to_async
    def _get_player_by_token(self, token_hash: str) -> Player | None:
        try:
            return Player.objects.get(token_hash=token_hash)
        except Player.DoesNotExist:
            return None

    @database_sync_to_async
    def _get_match_state(self) -> dict:
        try:
            match = Match.objects.select_related(
                "player_one", "player_two", "winner"
            ).get(id=self.match_id)
        except Match.DoesNotExist:
            return {"error": "match_not_found"}

        rounds = Round.objects.filter(match=match).order_by("number")
        rounds_data = []
        for r in rounds:
            moves = Move.objects.filter(round=r).select_related("player")
            rounds_data.append(
                {
                    "number": r.number,
                    "winner": str(r.winner_id) if r.winner_id else None,
                    "resolved": r.resolved_at is not None,
                    "moves": (
                        {str(m.player_id): m.choice for m in moves}
                        if r.resolved_at
                        else {
                            str(m.player_id): "hidden"
                            for m in moves
                        }
                    ),
                }
            )

        # Calcular score
        p1_wins = sum(1 for r in rounds if r.winner_id == match.player_one_id)
        p2_wins = sum(
            1 for r in rounds if match.player_two_id and r.winner_id == match.player_two_id
        )

        return {
            "match_id": str(match.id),
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
            "score": {"player_one": p1_wins, "player_two": p2_wins},
            "rounds": rounds_data,
            "winner": str(match.winner_id) if match.winner_id else None,
        }

    @database_sync_to_async
    def _submit_move(self, choice: str) -> dict:
        """Registra jogada, resolve rodada se ambos jogaram, encerra partida se necessário."""
        with transaction.atomic():
            try:
                match = Match.objects.select_for_update().get(id=self.match_id)
            except Match.DoesNotExist:
                return {"error": "match_not_found", "message": "Partida não encontrada."}

            if match.status != Match.Status.PLAYING:
                return {"error": "match_not_playing", "message": "A partida não está em andamento."}

            # Verificar que o jogador faz parte da partida
            player_id = self.player.id
            if player_id not in (match.player_one_id, match.player_two_id):
                return {"error": "not_in_match", "message": "Você não faz parte desta partida."}

            # Obter ou criar a rodada atual
            current_round_number = Round.objects.filter(match=match).count() + 1
            current_round, _ = Round.objects.get_or_create(
                match=match,
                number=current_round_number,
                defaults={},
            )
            # Se a rodada já está resolvida, precisamos de uma nova
            if current_round.resolved_at:
                current_round_number += 1
                current_round, _ = Round.objects.get_or_create(
                    match=match,
                    number=current_round_number,
                    defaults={},
                )

            # Verificar se o jogador já jogou nesta rodada
            if Move.objects.filter(round=current_round, player=self.player).exists():
                return {"error": "already_moved", "message": "Você já jogou nesta rodada."}

            # Registrar jogada
            Move.objects.create(
                round=current_round,
                player=self.player,
                choice=choice,
            )

            # Verificar se ambos jogaram
            moves = list(Move.objects.filter(round=current_round).select_related("player"))

            # Bot: gera jogada automática
            if match.mode == Match.Mode.BOT and len(moves) == 1:
                bot_choice = random.choice([m.value for m in RulesMove])
                # O bot é player_two (que não existe no banco como real)
                # Para bot, simulamos resolvendo diretamente
                outcome = resolve(RulesMove(choice), RulesMove(bot_choice))

                current_round.resolved_at = timezone.now()
                if outcome.winner == 0:
                    current_round.winner = match.player_one
                elif outcome.winner == 1:
                    current_round.winner = None  # bot venceu, mas não tem player
                current_round.save()

                rule = None
                if outcome.verb:
                    winner_move = choice if outcome.winner == 0 else bot_choice
                    loser_move = bot_choice if outcome.winner == 0 else choice
                    rule = {
                        "winner": winner_move,
                        "verb": outcome.verb,
                        "loser": loser_move,
                    }

                result = {
                    "round_result": {
                        "round_number": current_round_number,
                        "choices": {
                            str(match.player_one_id): choice,
                            "bot": bot_choice,
                        },
                        "winner": (
                            str(match.player_one_id)
                            if outcome.winner == 0
                            else ("bot" if outcome.winner == 1 else None)
                        ),
                        "rule": rule,
                    }
                }

                # Verificar se a partida acabou
                match_result = self._check_match_end(match)
                if match_result:
                    result["match_finished"] = match_result

                return result

            if len(moves) < 2:
                return {"waiting": True}

            # Ambos jogaram — resolver
            move_a = next(m for m in moves if m.player_id == match.player_one_id)
            move_b = next(m for m in moves if m.player_id == match.player_two_id)

            outcome = resolve(RulesMove(move_a.choice), RulesMove(move_b.choice))

            current_round.resolved_at = timezone.now()
            if outcome.winner == 0:
                current_round.winner = match.player_one
            elif outcome.winner == 1:
                current_round.winner = match.player_two
            current_round.save()

            rule = None
            if outcome.verb:
                winner_choice = move_a.choice if outcome.winner == 0 else move_b.choice
                loser_choice = move_b.choice if outcome.winner == 0 else move_a.choice
                rule = {
                    "winner": winner_choice,
                    "verb": outcome.verb,
                    "loser": loser_choice,
                }

            result = {
                "round_result": {
                    "round_number": current_round_number,
                    "choices": {
                        str(match.player_one_id): move_a.choice,
                        str(match.player_two_id): move_b.choice,
                    },
                    "winner": (
                        str(match.player_one_id)
                        if outcome.winner == 0
                        else (str(match.player_two_id) if outcome.winner == 1 else None)
                    ),
                    "rule": rule,
                }
            }

            # Verificar se a partida acabou
            match_result = self._check_match_end(match)
            if match_result:
                result["match_finished"] = match_result

            return result

    def _check_match_end(self, match: Match) -> dict | None:
        """Verifica se alguém atingiu maioria (best_of). Roda dentro de transaction.atomic()."""
        rounds = Round.objects.filter(match=match, resolved_at__isnull=False)
        wins_needed = (match.best_of // 2) + 1

        p1_wins = rounds.filter(winner=match.player_one).count()
        p2_wins = rounds.filter(winner=match.player_two).count() if match.player_two else 0

        winner = None
        if p1_wins >= wins_needed:
            winner = match.player_one
        elif p2_wins >= wins_needed:
            winner = match.player_two

        if winner:
            match.winner = winner
            match.status = Match.Status.FINISHED
            match.save()
            return {
                "winner": str(winner.id),
                "score": {"player_one": p1_wins, "player_two": p2_wins},
            }

        # Verificar empate (todas as rodadas usadas sem vencedor)
        total_rounds = rounds.count()
        if total_rounds >= match.best_of:
            match.status = Match.Status.FINISHED
            match.save()
            return {
                "winner": None,
                "score": {"player_one": p1_wins, "player_two": p2_wins},
            }

        return None
