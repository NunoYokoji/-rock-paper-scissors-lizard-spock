"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { PlayerProfile } from "@/features/game/types";
import {
  Zap,
  Lock,
  Bot,
  Trophy,
  LogOut,
  User,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function LobbyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [bestOf, setBestOf] = useState<3 | 5>(3);
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMe()
      .then((data) => setProfile(data))
      .catch(() => {
        storage.clearAll();
        router.push("/");
      });
  }, [router]);

  const handleStartMatch = async (mode: "quick" | "private" | "bot") => {
    setError(null);
    setLoadingMode(mode);
    try {
      const match = await api.createMatch(mode, bestOf);
      router.push(`/match/${match.id}`);
    } catch (err: any) {
      setError(err.message || "Erro ao iniciar partida.");
    } finally {
      setLoadingMode(null);
    }
  };

  const handleJoinPrivateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("O código da sala deve conter exatamente 6 caracteres.");
      return;
    }

    setError(null);
    setLoadingMode("join");
    try {
      const match = await api.joinMatch(code);
      router.push(`/match/${match.id}`);
    } catch (err: any) {
      setError(err.message || "Não foi possível entrar na sala.");
    } finally {
      setLoadingMode(null);
    }
  };

  const handleLogout = () => {
    storage.clearAll();
    router.push("/");
  };

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-8">
      {/* Top Navbar Header */}
      <header className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base sm:text-lg">
              {profile.nickname}
            </h2>
            <span className="text-xs text-slate-400">
              {profile.matches_played || 0} partidas jogadas · {profile.wins || 0}{" "}
              vitórias
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/ranking")}
            className="hidden sm:inline-flex"
          >
            <Trophy className="w-4 h-4 mr-1.5 text-amber-400" />
            Ranking
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1 text-slate-400" />
            Sair
          </Button>
        </div>
      </header>

      {/* Seletor de Formato (Melhor de 3 ou 5) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Formato da Partida
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina quantas rodadas são necessárias para vencer o confronto
          </p>
        </div>
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setBestOf(3)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              bestOf === 3
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Melhor de 3
          </button>
          <button
            type="button"
            onClick={() => setBestOf(5)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              bestOf === 5
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Melhor de 5
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid de Modos de Jogo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Modo 1: Partida Rápida */}
        <Card
          variant="glass"
          className="p-6 flex flex-col justify-between space-y-6 hover:border-indigo-500/50 transition-all group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Partida Rápida</h3>
              <p className="text-xs text-slate-400 mt-1">
                Entre na fila pública e enfrente outro jogador em tempo real.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            className="w-full"
            isLoading={loadingMode === "quick"}
            onClick={() => handleStartMatch("quick")}
          >
            Buscar Partida
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>

        {/* Modo 2: Sala Privada */}
        <Card
          variant="glass"
          className="p-6 flex flex-col justify-between space-y-6 hover:border-indigo-500/50 transition-all group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Sala Privada</h3>
              <p className="text-xs text-slate-400 mt-1">
                Crie um código de 6 caracteres ou entre na sala de um amigo.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              isLoading={loadingMode === "private"}
              onClick={() => handleStartMatch("private")}
            >
              Criar Nova Sala
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowJoinModal(true)}
            >
              Entrar com Código
            </Button>
          </div>
        </Card>

        {/* Modo 3: Contra o Bot (Sheldon) */}
        <Card
          variant="glass"
          className="p-6 flex flex-col justify-between space-y-6 hover:border-purple-500/50 transition-all group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Contra o Bot</h3>
                <Badge variant="info">Treino</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enfrente a IA instantaneamente sem precisar esperar oponente.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            className="w-full !from-purple-600 !to-pink-600 hover:!from-purple-500 hover:!to-pink-500"
            isLoading={loadingMode === "bot"}
            onClick={() => handleStartMatch("bot")}
          >
            Desafiar Bot 🤖
          </Button>
        </Card>
      </div>

      {/* Modal para Entrar em Sala Privada */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <Card variant="glass" className="w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Entrar em Sala Privada</h3>
            <form onSubmit={handleJoinPrivateRoom} className="space-y-4">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono text-xl tracking-widest text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  isLoading={loadingMode === "join"}
                >
                  Entrar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
