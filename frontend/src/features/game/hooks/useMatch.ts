"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WebSocketTransport, GameTransport } from "@/lib/socket";
import type {
  MatchFinishedData,
  MatchStateData,
  MoveType,
  RoundResultData,
} from "../types";

export function useMatch(
  matchId: string | null,
  transportFactory: () => GameTransport = () => new WebSocketTransport()
) {
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  const [matchState, setMatchState] = useState<MatchStateData | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResultData | null>(
    null
  );
  const [matchFinished, setMatchFinished] = useState<MatchFinishedData | null>(
    null
  );
  const [opponentStatus, setOpponentStatus] = useState<{
    joined: boolean;
    hasMoved: boolean;
  }>({ joined: false, hasMoved: false });

  const [selectedMove, setSelectedMove] = useState<MoveType | null>(null);
  const [moveSubmitted, setMoveSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transportRef = useRef<GameTransport | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const transport = transportFactory();
    transportRef.current = transport;

    setConnectionStatus("connecting");
    transport.connect(matchId);

    const unsubscribe = transport.subscribe((msg: any) => {
      switch (msg.type) {
        case "connection.status":
          setConnectionStatus(msg.status === "connected" ? "connected" : "connecting");
          break;

        case "match.state":
          setMatchState(msg);
          if (msg.player_two || msg.mode === "bot") {
            setOpponentStatus((prev) => ({ ...prev, joined: true }));
          }
          break;

        case "opponent.joined":
          setOpponentStatus((prev) => ({ ...prev, joined: true }));
          break;

        case "opponent.left":
          setOpponentStatus((prev) => ({ ...prev, joined: false }));
          break;

        case "opponent.moved":
          setOpponentStatus((prev) => ({ ...prev, hasMoved: true }));
          break;

        case "round.result":
          setLastRoundResult(msg);
          setMoveSubmitted(false);
          setSelectedMove(null);
          setOpponentStatus((prev) => ({ ...prev, hasMoved: false }));

          // Atualizar score localmente
          setMatchState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              rounds: [
                ...prev.rounds,
                {
                  number: msg.round_number,
                  winner: msg.winner,
                  resolved: true,
                  moves: msg.choices,
                },
              ],
            };
          });
          break;

        case "match.finished":
          setMatchFinished(msg);
          setMatchState((prev) => (prev ? { ...prev, status: "finished" } : null));
          break;

        case "error":
          setErrorMessage(msg.message || "Ocorreu um erro no servidor.");
          setMoveSubmitted(false);
          break;
      }
    });

    return () => {
      unsubscribe();
      transport.disconnect();
    };
  }, [matchId, transportFactory]);

  const submitMove = useCallback(
    (choice: MoveType) => {
      if (!transportRef.current || moveSubmitted) return;
      setSelectedMove(choice);
      setMoveSubmitted(true);
      setErrorMessage(null);
      transportRef.current.send({ type: "move.submit", choice });
    },
    [moveSubmitted]
  );

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
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
  };
}
