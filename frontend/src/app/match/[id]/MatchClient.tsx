"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { storage } from "@/lib/storage";
import { useRules } from "@/features/game/hooks/useRules";
import { useMatch } from "@/features/game/hooks/useMatch";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { MoveCard } from "@/components/game/MoveCard";
import { RulesPanel } from "@/components/game/RulesPanel";
import { RulesSheet } from "@/components/game/RulesSheet";
import { RulesPentagon } from "@/components/game/RulesPentagon";
import { AppliedRuleBanner } from "@/components/game/AppliedRuleBanner";
import { MatchResultModal } from "@/components/game/MatchResultModal";
import { Button } from "@/components/ui/Button";
import type { MoveType, PlayerProfile } from "@/features/game/types";
import { BookOpen, CheckCircle, ArrowLeft } from "lucide-react";

export default function MatchClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchId } = use(params);
  const router = useRouter();

  const [currentPlayer, setCurrentPlayer] = useState<PlayerProfile | null>(
    null
  );
  const [focusMove, setFocusMove] = useState<MoveType | null>(null);
  const [showRulesSheet, setShowRulesSheet] = useState(false);

  const { moves, rules, getBeats, getLosesTo } = useRules();
  const {
    connectionStatus,
    matchState,
    lastRoundResult,
    matchFinished,
    opponentStatus,
    selectedMove,
    setSelectedMove,
    moveSubmitted,
    errorMessage,
    submitMove,
    clearError,
  } = useMatch(matchId);

  useEffect(() => {
    api
      .getMe()
      .then((p) => setCurrentPlayer(p))
      .catch(() => {
        storage.clearAll();
        router.push("/");
      });
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "r" || e.key === "R") {
        setShowRulesSheet((prev) => !prev);
      } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (moves[index]) {
          setSelectedMove(moves[index].id);
        }
      } else if (e.key === "Enter" && selectedMove && !moveSubmitted) {
        submitMove(selectedMove);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moves, selectedMove, moveSubmitted, submitMove, setSelectedMove]);

  const handleConfirmMove = () => {
    if (selectedMove) {
      submitMove(selectedMove);
    }
  };

  const handlePlayAgain = () => {
    router.push("/lobby");
  };

  if (!matchState || !currentPlayer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
        <p className="text-sm text-slate-400">Conectando à arena de jogo...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex flex-col">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/lobby")}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Sair da Partida
        </Button>
        <button
          type="button"
          onClick={() => setShowRulesSheet(true)}
          className="sm:hidden px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-300 flex items-center gap-1.5"
        >
          <BookOpen className="w-4 h-4" />
          📖 Regras (Atalhos: R)
        </button>
      </div>

      <ScoreBoard
        matchState={matchState}
        connectionStatus={connectionStatus}
        currentPlayerId={currentPlayer.id}
        opponentHasMoved={opponentStatus.hasMoved}
      />

      <AppliedRuleBanner roundResult={lastRoundResult} />

      {errorMessage && (
        <div className="w-full max-w-xl mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={clearError} className="underline font-bold">
            OK
          </button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="hidden sm:block">
            <RulesPentagon
              moves={moves}
              rules={rules}
              focus={focusMove}
              selectedMove={selectedMove}
              onSelectMove={(m) => !moveSubmitted && setSelectedMove(m)}
              onHoverStart={(m) => setFocusMove(m)}
              onHoverEnd={() => setFocusMove(null)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Selecione sua jogada (ou use teclas 1–5):</span>
              {selectedMove && (
                <span className="text-indigo-400 font-bold capitalize">
                  Selecionado: {selectedMove}
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {moves.map((m, index) => (
                <MoveCard
                  key={m.id}
                  move={m}
                  shortcutNumber={index + 1}
                  isSelected={selectedMove === m.id}
                  isDisabled={moveSubmitted}
                  onSelect={(id) => !moveSubmitted && setSelectedMove(id)}
                  onHoverStart={(id) => setFocusMove(id)}
                  onHoverEnd={() => setFocusMove(null)}
                  beatsRules={getBeats(m.id)}
                  losesToRules={getLosesTo(m.id)}
                />
              ))}
            </div>

            <div className="flex flex-col items-center justify-center pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full max-w-sm"
                disabled={!selectedMove || moveSubmitted}
                isLoading={moveSubmitted}
                onClick={handleConfirmMove}
              >
                {moveSubmitted ? (
                  "Aguardando oponente..."
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Jogada (Enter)
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block sticky top-6">
          <RulesPanel
            rules={rules}
            focus={focusMove || selectedMove}
            applied={lastRoundResult?.rule}
          />
        </div>
      </div>

      <RulesSheet
        isOpen={showRulesSheet}
        onClose={() => setShowRulesSheet(false)}
        rules={rules}
        focus={focusMove || selectedMove}
        applied={lastRoundResult?.rule}
      />

      <MatchResultModal
        finishedData={matchFinished}
        currentPlayer={currentPlayer}
        onPlayAgain={handlePlayAgain}
        onBackToLobby={() => router.push("/lobby")}
      />
    </div>
  );
}
