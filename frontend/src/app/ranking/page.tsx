"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { PlayerProfile } from "@/features/game/types";
import { Trophy, ArrowLeft, Medal } from "lucide-react";

export default function RankingPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLeaderboard()
      .then((data) => setLeaderboard(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/lobby")}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar ao Lobby
        </Button>
      </div>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Trophy className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Hall da Fama · Ranking Global
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Os maiores estrategistas da arena ordenados por vitórias e taxa de aproveitamento.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : leaderboard.length === 0 ? (
        <Card variant="glass" className="p-8 text-center text-slate-400">
          Nenhuma partida finalizada ainda. Seja o primeiro a liderar o ranking!
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-400 uppercase">
                  <th className="py-3 px-4"># Pos</th>
                  <th className="py-3 px-4">Jogador</th>
                  <th className="py-3 px-4 text-center">Vitórias</th>
                  <th className="py-3 px-4 text-center">Derrotas</th>
                  <th className="py-3 px-4 text-center">Empates</th>
                  <th className="py-3 px-4 text-right">Aproveitamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {leaderboard.map((p, index) => {
                  const rank = index + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isTop1 ? "bg-amber-500/5 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold">
                        {isTop1 ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Medal className="w-4 h-4" /> 1º
                          </span>
                        ) : isTop2 ? (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Medal className="w-4 h-4" /> 2º
                          </span>
                        ) : isTop3 ? (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Medal className="w-4 h-4" /> 3º
                          </span>
                        ) : (
                          `${rank}º`
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {p.nickname}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">
                        {p.wins}
                      </td>
                      <td className="py-3 px-4 text-center text-rose-400">
                        {p.losses}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {p.draws}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-400">
                        {p.win_rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
