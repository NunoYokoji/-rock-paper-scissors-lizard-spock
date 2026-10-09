import React from "react";
import type { MoveInfo, MoveType, RuleItem } from "@/features/game/types";

interface MoveCardProps {
  move: MoveInfo;
  shortcutNumber?: number;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (move: MoveType) => void;
  onHoverStart?: (move: MoveType) => void;
  onHoverEnd?: () => void;
  beatsRules?: RuleItem[];
  losesToRules?: RuleItem[];
}

export const MoveCard: React.FC<MoveCardProps> = ({
  move,
  shortcutNumber,
  isSelected,
  isDisabled,
  onSelect,
  onHoverStart,
  onHoverEnd,
  beatsRules = [],
  losesToRules = [],
}) => {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(move.id)}
      onMouseEnter={() => onHoverStart?.(move.id)}
      onMouseLeave={() => onHoverEnd?.()}
      onFocus={() => onHoverStart?.(move.id)}
      onBlur={() => onHoverEnd?.()}
      className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer select-none outline-none focus:ring-4 focus:ring-indigo-500/50 min-h-[90px] sm:min-h-[110px] ${
        isSelected
          ? "bg-gradient-to-b from-indigo-600/30 to-purple-600/30 border-indigo-400 shadow-xl shadow-indigo-500/20 scale-105"
          : "bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 hover:scale-[1.03]"
      } ${isDisabled ? "opacity-40 cursor-not-allowed hover:scale-100" : ""}`}
    >
      {/* Atalho de teclado */}
      {shortcutNumber && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 group-hover:text-indigo-300 border border-slate-700">
          {shortcutNumber}
        </span>
      )}

      {/* Ícone principal */}
      <span className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110">
        {move.icon}
      </span>

      {/* Label */}
      <span className="mt-1 font-bold text-xs sm:text-sm text-slate-200 capitalize">
        {move.label}
      </span>

      {/* Verso / Resumo de Regras em Tooltip no Hover */}
      <div className="hidden group-hover:flex group-focus:flex flex-col gap-0.5 absolute -top-16 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-[11px] z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
        <div className="text-emerald-400 font-medium">
          ✓ Vence: {beatsRules.map((r) => r.loser).join(", ")}
        </div>
        <div className="text-rose-400 font-medium">
          ✗ Perde: {losesToRules.map((r) => r.winner).join(", ")}
        </div>
      </div>
    </button>
  );
};
