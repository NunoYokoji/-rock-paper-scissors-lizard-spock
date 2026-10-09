import React from "react";
import type { MoveType, RuleItem } from "@/features/game/types";

interface RuleRowProps {
  rule: RuleItem;
  status: "neutral" | "wins" | "loses" | "dimmed" | "applied";
  moveIcons?: Record<MoveType, string>;
}

const DEFAULT_ICONS: Record<MoveType, string> = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
  lizard: "🦎",
  spock: "🖖",
};

export const RuleRow: React.FC<RuleRowProps> = ({
  rule,
  status,
  moveIcons = DEFAULT_ICONS,
}) => {
  const baseStyle =
    "flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border";

  const statusStyles = {
    neutral: "bg-slate-800/40 border-slate-800 text-slate-300",
    wins: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10",
    loses: "bg-rose-500/15 border-rose-500/40 text-rose-300 opacity-80",
    dimmed: "bg-slate-900/30 border-slate-900 text-slate-600 opacity-40",
    applied:
      "bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 animate-pulse shadow-lg shadow-amber-500/20",
  };

  const getStatusBadge = () => {
    if (status === "wins")
      return <span className="text-emerald-400 font-bold ml-1">✓ vence</span>;
    if (status === "loses")
      return <span className="text-rose-400 font-bold ml-1">✗ perde</span>;
    if (status === "applied")
      return <span className="text-amber-300 font-bold ml-1">★ aplicada</span>;
    return null;
  };

  return (
    <li className={`${baseStyle} ${statusStyles[status]}`}>
      <div className="flex items-center gap-2">
        <span className="w-5 text-center text-slate-500 font-mono text-xs">
          {rule.order}.
        </span>
        <span className="text-base">{moveIcons[rule.winner]}</span>
        <span className="capitalize font-semibold text-slate-100">
          {rule.winner}
        </span>
        <span className="italic text-slate-400 font-normal px-1">
          {rule.verb}
        </span>
        <span className="text-base">{moveIcons[rule.loser]}</span>
        <span className="capitalize font-semibold text-slate-100">
          {rule.loser}
        </span>
      </div>
      <div>{getStatusBadge()}</div>
    </li>
  );
};
