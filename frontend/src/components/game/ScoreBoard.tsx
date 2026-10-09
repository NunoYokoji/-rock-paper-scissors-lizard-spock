import React from "react";
import { Badge } from "@/components/ui/Badge";
import type { MatchStateData } from "@/features/game/types";

interface ScoreBoardProps {
  matchState: MatchStateData | null;
  connectionStatus: "disconnected" | "connecting" | "connected";
  currentPlayerId: string | null;
  opponentHasMoved?: boolean;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  matchState,
  connectionStatus,
  currentPlayerId,
  opponentHasMoved = false,
}) => {
  if (!matchState) return null;

  const isP1 = currentPlayerId === matchState.player_one.id;
  const p1Name = matchState.player_one.nickname + (isP1 ? " (Você)" : "");
  const p2Name = matchState.player_two
    ? matchState.player_two.nickname + (!isP1 ? " (Você)" : "")
    : matchState.mode === "bot"
    ? "Sheldon (Bot 🤖)"
    : "Aguardando...";

  const currentRound = matchState.rounds.length;
  const maxRounds = matchState.best_of;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
      {/* Top Header info */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              connectionStatus === "connected"
                ? "success"
                : connectionStatus === "connecting"
                ? "warning"
                : "danger"
            }
          >
            ● {connectionStatus === "connected" ? "Conectado" : "Conectando..."}
          </Badge>
          <Badge variant="info">
            {matchState.mode === "bot"
              ? "🤖 Bot"
              : matchState.mode === "private"
              ? `🔒 Sala ${matchState.code || ""}`
              : "⚡ Rápida"}
          </Badge>
        </div>

        <div className="font-mono text-slate-400 font-semibold">
          Rodada {Math.min(currentRound + 1, maxRounds)} de {maxRounds}
        </div>
      </div>

      {/* Placar Principal */}
      <div className="grid grid-cols-3 items-center text-center">
        {/* Jogador 1 */}
        <div className="flex flex-col items-center">
          <span className="font-bold text-sm sm:text-base text-slate-200 truncate max-w-[120px] sm:max-w-[180px]">
            {p1Name}
          </span>
          <span className="text-3xl sm:text-4xl font-black text-indigo-400 mt-1">
            {matchState.score.player_one}
          </span>
        </div>

        {/* VS Central */}
        <div className="flex flex-col items-center">
          <span className="text-xl sm:text-2xl font-black text-slate-600 tracking-widest">
            VS
          </span>
          {opponentHasMoved && (
            <span className="mt-1 text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
              ✓ Oponente jogou
            </span>
          )}
        </div>

        {/* Jogador 2 */}
        <div className="flex flex-col items-center">
          <span className="font-bold text-sm sm:text-base text-slate-200 truncate max-w-[120px] sm:max-w-[180px]">
            {p2Name}
          </span>
          <span className="text-3xl sm:text-4xl font-black text-purple-400 mt-1">
            {matchState.score.player_two}
          </span>
        </div>
      </div>
    </div>
  );
};
