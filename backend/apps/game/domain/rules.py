"""
Motor de regras de Pedra, Papel, Tesoura, Lagarto, Spock.

Fonte única da verdade — Python puro, sem dependências Django.
Alimenta o resolvedor de rodadas e o painel "quem vence quem" no frontend.
"""
from enum import StrEnum
from dataclasses import dataclass


class Move(StrEnum):
    ROCK = "rock"
    PAPER = "paper"
    SCISSORS = "scissors"
    LIZARD = "lizard"
    SPOCK = "spock"


# Ordem clássica da série: cada regra "encadeia" na próxima.
RULES_ORDER: list[tuple[Move, str, Move]] = [
    (Move.SCISSORS, "corta", Move.PAPER),
    (Move.PAPER, "cobre", Move.ROCK),
    (Move.ROCK, "esmaga", Move.LIZARD),
    (Move.LIZARD, "envenena", Move.SPOCK),
    (Move.SPOCK, "esmaga", Move.SCISSORS),
    (Move.SCISSORS, "decapita", Move.LIZARD),
    (Move.LIZARD, "come", Move.PAPER),
    (Move.PAPER, "refuta", Move.SPOCK),
    (Move.SPOCK, "vaporiza", Move.ROCK),
    (Move.ROCK, "quebra", Move.SCISSORS),
]

# Índice derivado (nunca editado à mão): BEATS[vencedor][perdedor] = verbo
BEATS: dict[Move, dict[Move, str]] = {m: {} for m in Move}
for _winner, _verb, _loser in RULES_ORDER:
    BEATS[_winner][_loser] = _verb

# Mapa de labels e ícones para a API
MOVE_INFO: dict[Move, dict[str, str]] = {
    Move.ROCK: {"label": "Pedra", "icon": "🪨"},
    Move.PAPER: {"label": "Papel", "icon": "📄"},
    Move.SCISSORS: {"label": "Tesoura", "icon": "✂️"},
    Move.LIZARD: {"label": "Lagarto", "icon": "🦎"},
    Move.SPOCK: {"label": "Spock", "icon": "🖖"},
}


@dataclass(frozen=True)
class RoundOutcome:
    winner: int | None  # 0 (jogador a), 1 (jogador b) ou None (empate)
    verb: str | None  # ex.: "vaporiza"


def resolve(a: Move, b: Move) -> RoundOutcome:
    """Resolve uma rodada entre a jogada `a` e a jogada `b`."""
    if a == b:
        return RoundOutcome(None, None)
    if b in BEATS[a]:
        return RoundOutcome(0, BEATS[a][b])
    return RoundOutcome(1, BEATS[b][a])
