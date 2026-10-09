import React from "react";
import type { MoveType, RuleItem } from "@/features/game/types";
import { RuleRow } from "./RuleRow";

interface RulesPanelProps {
  rules: RuleItem[];
  focus?: MoveType | null;
  applied?: { winner: MoveType; verb: string; loser: MoveType } | null;
  className?: string;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({
  rules,
  focus,
  applied,
  className = "",
}) => {
  return (
    <section
      aria-labelledby="rules-title"
      className={`rounded-2xl p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl ${className}`}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <h2 id="rules-title" className="font-bold text-slate-100 flex items-center gap-2">
          <span>📖</span> Quem vence quem
        </h2>
        <span className="text-xs text-slate-400 font-mono">10 Regras</span>
      </div>

      <ol className="space-y-1.5" aria-live="polite">
        {rules.map((rule) => {
          const isApplied =
            applied &&
            applied.winner === rule.winner &&
            applied.loser === rule.loser;

          let status: "neutral" | "wins" | "loses" | "dimmed" | "applied" =
            "neutral";

          if (isApplied) {
            status = "applied";
          } else if (focus) {
            if (rule.winner === focus) {
              status = "wins";
            } else if (rule.loser === focus) {
              status = "loses";
            } else {
              status = "dimmed";
            }
          }

          return <RuleRow key={rule.order} rule={rule} status={status} />;
        })}
      </ol>
    </section>
  );
};
