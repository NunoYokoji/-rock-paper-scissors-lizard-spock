"""
Autenticação customizada por token Bearer.
O token é um UUID gerado no registro; no banco fica apenas o hash SHA-256.
"""
import hashlib

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from apps.players.models import Player


class TokenAuthentication(BaseAuthentication):
    """
    Autentica via header `Authorization: Bearer <token>`.
    Compara o SHA-256 do token recebido com o `token_hash` no banco.
    """

    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith(f"{self.keyword} "):
            return None

        token = auth_header[len(self.keyword) + 1 :]
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        try:
            player = Player.objects.get(token_hash=token_hash)
        except Player.DoesNotExist:
            raise AuthenticationFailed("Token inválido ou expirado.")

        # Atualiza last_seen_at (auto_now cuida disso no save)
        Player.objects.filter(pk=player.pk).update(
            last_seen_at=__import__("django.utils.timezone", fromlist=["now"]).now()
        )

        return (player, token)
