import React from "react";
import type { MoveInfo, MoveType, RuleItem } from "@/features/game/types";

interface RulesPentagonProps {
  moves: MoveInfo[];
  rules: RuleItem[];
  focus?: MoveType | null;
  selectedMove?: MoveType | null;
  onSelectMove?: (move: MoveType) => void;
  onHoverStart?: (move: MoveType) => void;
  onHoverEnd?: () => void;
}

// Posições dos 5 vértices no pentágono (raio R=140, centro X=200, Y=200)
// Vértice 0 (Topo - Rock), Vértice 1 (Spock), Vértice 2 (Paper), Vértice 3 (Scissors), Vértice 4 (Lizard)
const PENTAGON_NODES: Record<MoveType, { x: number; y: number; angle: number }> = {
  rock: { x: 200, y: 60, angle: -90 },
  paper: { x: 330, y: 155, angle: -18 },
  scissors: { x: 280, y: 310, angle: 54 },
  lizard: { x: 120, y: 310, angle: 126 },
  spock: { x: 70, y: 155, angle: 198 },
};

export const RulesPentagon: React.FC<RulesPentagonProps> = ({
  moves,
  rules,
  focus,
  selectedMove,
  onSelectMove,
  onHoverStart,
  onHoverEnd,
}) => {
  const activeFocus = focus || selectedMove;

  return (
    <div className="relative w-full max-w-[420px] aspect-square mx-auto flex items-center justify-center select-none">
      {/* SVG de conexões com setas */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
        <defs>
          <marker
            id="arrow-default"
            viewBox="0 0 10 10"
            refX="20"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
          </marker>

          <marker
            id="arrow-wins"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
          </marker>

          <marker
            id="arrow-loses"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
          </marker>
        </defs>

        {/* Linhas das 10 regras */}
        {rules.map((rule) => {
          const from = PENTAGON_NODES[rule.winner];
          const to = PENTAGON_NODES[rule.loser];

          if (!from || !to) return null;

          let strokeColor = "#334155"; // slate-700
          let strokeWidth = 2;
          let markerId = "arrow-default";
          let opacity = 0.5;

          if (activeFocus) {
            if (rule.winner === activeFocus) {
              strokeColor = "#10b981"; // emerald-500
              strokeWidth = 3.5;
              markerId = "arrow-wins";
              opacity = 1;
            } else if (rule.loser === activeFocus) {
              strokeColor = "#f43f5e"; // rose-500
              strokeWidth = 3.5;
              markerId = "arrow-loses";
              opacity = 1;
            } else {
              opacity = 0.15;
            }
          }

          return (
            <g key={rule.order}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                opacity={opacity}
                markerEnd={`url(#${markerId})`}
                className="transition-all duration-300"
              />
            </g>
          );
        })}
      </svg>

      {/* Nós interativos das 5 jogadas posicionados sobre os vértices */}
      {moves.map((m) => {
        const pos = PENTAGON_NODES[m.id];
        if (!pos) return null;

        const isSelected = selectedMove === m.id;
        const isHovered = focus === m.id;

        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectMove?.(m.id)}
            onMouseEnter={() => onHoverStart?.(m.id)}
            onMouseLeave={() => onHoverEnd?.()}
            onFocus={() => onHoverStart?.(m.id)}
            onBlur={() => onHoverEnd?.()}
            style={{
              left: `${(pos.x / 400) * 100}%`,
              top: `${(pos.y / 400) * 100}%`,
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 shadow-xl cursor-pointer outline-none focus:ring-4 focus:ring-indigo-500/50 ${
              isSelected || isHovered
                ? "bg-gradient-to-b from-indigo-600 to-purple-600 border-indigo-300 scale-125 z-20 shadow-indigo-500/30"
                : "bg-slate-900 border-slate-700 hover:border-slate-500 hover:scale-110 z-10"
            }`}
          >
            <span className="text-2xl sm:text-3xl">{m.icon}</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-200 capitalize mt-0.5">
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
