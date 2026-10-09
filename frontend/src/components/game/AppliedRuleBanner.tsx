import React from "react";
import type { MoveType, RoundResultData } from "@/features/game/types";

interface AppliedRuleBannerProps {
  roundResult: RoundResultData | null;
  moveIcons?: Record<MoveType, string>;
}

const DEFAULT_ICONS: Record<MoveType, string> = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
  lizard: "🦎",
  spock: "🖖",
};

export const AppliedRuleBanner: React.FC<AppliedRuleBannerProps> = ({
  roundResult,
  moveIcons = DEFAULT_ICONS,
}) => {
  if (!roundResult) return null;

  const { rule, winner } = roundResult;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="w-full max-w-xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/40 shadow-xl text-center my-4 animate-in zoom-in-95 duration-300"
    >
      <span className="text-xs font-mono text-indigo-300 uppercase tracking-widest block mb-1">
        Resultado da Rodada #{roundResult.round_number}
      </span>

      {rule ? (
        <div className="text-lg sm:text-xl font-black text-white flex items-center justify-center gap-2">
          <span>{moveIcons[rule.winner]}</span>
          <span className="capitalize text-indigo-200">{rule.winner}</span>
          <span className="text-amber-400 italic px-1">{rule.verb}</span>
          <span>{moveIcons[rule.loser]}</span>
          <span className="capitalize text-slate-300">{rule.loser}</span>
        </div>
      ) : (
        <div className="text-lg font-bold text-amber-300 flex items-center justify-center gap-2">
          <span>🤝</span> Empate — jogadas idênticas!
        </div>
      )}
    </div>
  );
};
