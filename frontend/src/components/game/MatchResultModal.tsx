"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/Button";
import type { MatchFinishedData, PlayerProfile } from "@/features/game/types";

interface MatchResultModalProps {
  finishedData: MatchFinishedData | null;
  currentPlayer: PlayerProfile | null;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  finishedData,
  currentPlayer,
  onPlayAgain,
  onBackToLobby,
}) => {
  const isWinner =
    finishedData && currentPlayer && finishedData.winner === currentPlayer.id;
  const isDraw = finishedData && finishedData.winner === null;

  useEffect(() => {
    if (isWinner) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isWinner]);

  if (!finishedData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
        {/* Ícone de resultado */}
        <div className="text-6xl sm:text-7xl">
          {isWinner ? "🏆" : isDraw ? "🤝" : "💔"}
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isWinner
              ? "Vitória Bazinga!"
              : isDraw
              ? "Empate Técnico!"
              : "Derrota!"}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {isWinner
              ? "Sua estratégia foi superior e dominou o oponente!"
              : isDraw
              ? "Uma partida incrivelmente equilibrada."
              : "Não desanime! A física teórica exige prática constante."}
          </p>
        </div>

        {/* Placar Final */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-around font-mono text-xl">
          <div>
            <span className="text-xs text-slate-500 block">Você</span>
            <span className="font-bold text-indigo-400">
              {finishedData.score.player_one}
            </span>
          </div>
          <span className="text-slate-600 font-bold">-</span>
          <div>
            <span className="text-xs text-slate-500 block">Oponente</span>
            <span className="font-bold text-purple-400">
              {finishedData.score.player_two}
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="primary" className="flex-1" onClick={onPlayAgain}>
            🔄 Jogar Novamente
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onBackToLobby}>
            🏠 Voltar ao Lobby
          </Button>
        </div>
      </div>
    </div>
  );
};
