import uuid
import string
import random

from django.db import models

from apps.players.models import Player


def _generate_room_code() -> str:
    """Gera um código de 6 caracteres maiúsculos para sala privada."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Match(models.Model):
    """Partida entre dois jogadores (ou contra bot)."""

    class Mode(models.TextChoices):
        QUICK = "quick", "Partida rápida"
        PRIVATE = "private", "Sala privada"
        BOT = "bot", "Contra o bot"

    class Status(models.TextChoices):
        WAITING = "waiting", "Aguardando oponente"
        PLAYING = "playing", "Em andamento"
        FINISHED = "finished", "Finalizada"
        ABANDONED = "abandoned", "Abandonada"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(
        max_length=6,
        blank=True,
        null=True,
        default=None,
        help_text="Código de sala privada (6 caracteres)",
    )
    mode = models.CharField(max_length=10, choices=Mode.choices, default=Mode.QUICK)
    best_of = models.IntegerField(
        default=3,
        help_text="Melhor de 3 ou 5",
    )

    player_one = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="matches_as_p1"
    )
    player_two = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="matches_as_p2",
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.WAITING
    )
    winner = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="matches_won",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "game_match"
        indexes = [
            models.Index(fields=["status", "mode"], name="idx_match_status_mode"),
            models.Index(fields=["code"], name="idx_match_code"),
        ]

    def __str__(self) -> str:
        return f"Match {self.id} ({self.mode}/{self.status})"


class Round(models.Model):
    """Uma rodada dentro de uma partida."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="rounds")
    number = models.IntegerField(help_text="Número da rodada (começa em 1)")

    winner = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Nulo = empate",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "game_round"
        constraints = [
            models.UniqueConstraint(
                fields=["match", "number"], name="uq_round_match_number"
            ),
        ]

    def __str__(self) -> str:
        return f"Round {self.number} of {self.match_id}"


class Move(models.Model):
    """Jogada de um jogador em uma rodada."""

    class Choice(models.TextChoices):
        ROCK = "rock", "Pedra"
        PAPER = "paper", "Papel"
        SCISSORS = "scissors", "Tesoura"
        LIZARD = "lizard", "Lagarto"
        SPOCK = "spock", "Spock"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name="moves")
    player = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="moves"
    )
    choice = models.CharField(max_length=10, choices=Choice.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "game_move"
        constraints = [
            models.UniqueConstraint(
                fields=["round", "player"], name="uq_move_round_player"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.player} played {self.choice} in {self.round}"
