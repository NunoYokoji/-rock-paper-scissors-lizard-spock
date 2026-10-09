import React from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { RulesPanel } from "./RulesPanel";
import type { MoveType, RuleItem } from "@/features/game/types";

interface RulesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RuleItem[];
  focus?: MoveType | null;
  applied?: { winner: MoveType; verb: string; loser: MoveType } | null;
}

export const RulesSheet: React.FC<RulesSheetProps> = ({
  isOpen,
  onClose,
  rules,
  focus,
  applied,
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="📖 Tabela de Regras">
      <RulesPanel rules={rules} focus={focus} applied={applied} className="border-0 p-0 shadow-none" />
    </BottomSheet>
  );
};
