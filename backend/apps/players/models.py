import uuid

from django.db import models


class Player(models.Model):
    """Jogador identificado por apelido (guest login)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nickname = models.CharField(
        max_length=20,
        unique=True,
        help_text="Apelido único (3–20 caracteres: letras, números, _)",
    )
    token_hash = models.CharField(
        max_length=64,
        help_text="SHA-256 do token de sessão",
    )

    # Estatísticas (atualizadas pelo trigger game_apply_match_result)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    matches_played = models.IntegerField(default=0)

    last_seen_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "game_player"
        indexes = [
            models.Index(fields=["last_seen_at"], name="idx_player_last_seen"),
        ]

    def __str__(self) -> str:
        return self.nickname
