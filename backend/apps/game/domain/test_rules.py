"""
Testes obrigatórios do motor de regras.
1. Todas as 25 combinações de resolve().
2. Integridade de RULES_ORDER.
"""
import pytest
from apps.game.domain.rules import Move, RULES_ORDER, BEATS, resolve, RoundOutcome


class TestResolve:
    """Testa todas as 25 combinações de resolve()."""

    # ── Empates (5 combinações) ────────────────────────────────

    @pytest.mark.parametrize("move", list(Move))
    def test_empate(self, move: Move):
        result = resolve(move, move)
        assert result == RoundOutcome(None, None)

    # ── Vitórias de cada jogada (20 combinações) ──────────────

    @pytest.mark.parametrize(
        "a, b, expected_winner, expected_verb",
        [
            # Scissors
            (Move.SCISSORS, Move.PAPER, 0, "corta"),
            (Move.SCISSORS, Move.LIZARD, 0, "decapita"),
            # Paper
            (Move.PAPER, Move.ROCK, 0, "cobre"),
            (Move.PAPER, Move.SPOCK, 0, "refuta"),
            # Rock
            (Move.ROCK, Move.LIZARD, 0, "esmaga"),
            (Move.ROCK, Move.SCISSORS, 0, "quebra"),
            # Lizard
            (Move.LIZARD, Move.SPOCK, 0, "envenena"),
            (Move.LIZARD, Move.PAPER, 0, "come"),
            # Spock
            (Move.SPOCK, Move.SCISSORS, 0, "esmaga"),
            (Move.SPOCK, Move.ROCK, 0, "vaporiza"),
            # Inversas (b vence a → winner = 1)
            (Move.PAPER, Move.SCISSORS, 1, "corta"),
            (Move.LIZARD, Move.SCISSORS, 1, "decapita"),
            (Move.ROCK, Move.PAPER, 1, "cobre"),
            (Move.SPOCK, Move.PAPER, 1, "refuta"),
            (Move.LIZARD, Move.ROCK, 1, "esmaga"),
            (Move.SCISSORS, Move.ROCK, 1, "quebra"),
            (Move.SPOCK, Move.LIZARD, 1, "envenena"),
            (Move.PAPER, Move.LIZARD, 1, "come"),
            (Move.SCISSORS, Move.SPOCK, 1, "esmaga"),
            (Move.ROCK, Move.SPOCK, 1, "vaporiza"),
        ],
    )
    def test_vitorias(
        self, a: Move, b: Move, expected_winner: int, expected_verb: str
    ):
        result = resolve(a, b)
        assert result.winner == expected_winner
        assert result.verb == expected_verb

    def test_total_25_combinacoes_cobertas(self):
        """Garante que testamos todas as 5x5 = 25 combinações."""
        combos = set()
        for a in Move:
            for b in Move:
                result = resolve(a, b)
                combos.add((a, b))
                # Verifica que o resultado é consistente
                if a == b:
                    assert result.winner is None
                else:
                    assert result.winner in (0, 1)
                    assert result.verb is not None
        assert len(combos) == 25


class TestRulesOrderIntegrity:
    """Verifica a integridade da constante RULES_ORDER."""

    def test_exatamente_10_regras(self):
        assert len(RULES_ORDER) == 10

    def test_sem_pares_repetidos(self):
        pairs = [(w, l) for w, _, l in RULES_ORDER]
        assert len(pairs) == len(set(pairs)), "Há pares duplicados em RULES_ORDER"

    def test_cada_jogada_vence_exatamente_2(self):
        for move in Move:
            wins = [l for w, _, l in RULES_ORDER if w == move]
            assert len(wins) == 2, f"{move} vence {len(wins)} vez(es), deveria vencer 2"

    def test_cada_jogada_perde_para_exatamente_2(self):
        for move in Move:
            losses = [w for w, _, l in RULES_ORDER if l == move]
            assert len(losses) == 2, f"{move} perde {len(losses)} vez(es), deveria perder 2"

    def test_beats_consistente_com_rules_order(self):
        """BEATS deve refletir exatamente RULES_ORDER."""
        for winner, verb, loser in RULES_ORDER:
            assert BEATS[winner][loser] == verb
        # Total de entradas em BEATS = 10
        total = sum(len(losers) for losers in BEATS.values())
        assert total == 10
