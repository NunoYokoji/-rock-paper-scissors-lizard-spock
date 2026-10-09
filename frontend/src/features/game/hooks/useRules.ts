"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MoveInfo, MoveType, RuleItem } from "../types";

let rulesCache: { moves: MoveInfo[]; rules: RuleItem[] } | null = null;

export function useRules() {
  const [moves, setMoves] = useState<MoveInfo[]>(rulesCache?.moves || []);
  const [rules, setRules] = useState<RuleItem[]>(rulesCache?.rules || []);
  const [loading, setLoading] = useState(!rulesCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rulesCache) return;

    api
      .getRules()
      .then((data) => {
        rulesCache = data;
        setMoves(data.moves);
        setRules(data.rules);
      })
      .catch((err) => setError(err.message || "Erro ao carregar regras."))
      .finally(() => setLoading(false));
  }, []);

  const getBeats = (winner: MoveType) => {
    return rules.filter((r) => r.winner === winner);
  };

  const getLosesTo = (loser: MoveType) => {
    return rules.filter((r) => r.loser === loser);
  };

  return {
    moves,
    rules,
    loading,
    error,
    getBeats,
    getLosesTo,
  };
}
