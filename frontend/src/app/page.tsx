"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Sparkles, Gamepad2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o usuário já possui token salvo no navegador
  useEffect(() => {
    const existingToken = storage.getToken();
    if (existingToken) {
      api
        .getMe()
        .then((profile) => {
          storage.setNickname(profile.nickname);
          router.push("/lobby");
        })
        .catch(() => {
          storage.clearAll();
        });
    }
  }, [router]);

  // Checagem em tempo real de disponibilidade do apelido
  useEffect(() => {
    const trimmed = nickname.trim();
    if (trimmed.length < 3) {
      setAvailable(null);
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(() => {
      setChecking(true);
      api
        .checkNickname(trimmed)
        .then((res) => {
          setAvailable(res.available);
          setSuggestion(res.suggestion);
        })
        .catch(() => {})
        .finally(() => setChecking(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [nickname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();

    if (trimmed.length < 3 || trimmed.length > 20) {
      setError("O apelido deve ter entre 3 e 20 caracteres.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.guestLogin(trimmed);
      storage.setToken(res.token);
      storage.setNickname(res.player.nickname);
      router.push("/lobby");
    } catch (err: any) {
      setError(err.message || "Falha ao entrar como convidado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Luzes de Fundo de Efeito Neon */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-600/15 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Banner do Título */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Edição Especial Big Bang
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Pedra · Papel · Tesoura <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Lagarto · Spock
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Escolha seu apelido e dispute partidas multiplayer em tempo real com a tabela interativa de regras!
          </p>
        </div>

        {/* Card do Formulário */}
        <Card variant="glass" className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="nickname" className="block text-sm font-medium text-slate-200">
                Seu Apelido de Jogador
              </label>
              <div className="relative">
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex: spock_42"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                  required
                />
                {checking && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    verificando...
                  </span>
                )}
              </div>

              {/* Indicador de Disponibilidade */}
              {available !== null && nickname.trim().length >= 3 && !checking && (
                <div className="text-xs">
                  {available ? (
                    <span className="text-emerald-400 font-semibold">
                      ✓ Apelido disponível!
                    </span>
                  ) : (
                    <div className="space-y-1 text-rose-400">
                      <span>✗ Apelido já cadastrado.</span>
                      {suggestion && (
                        <div>
                          Sugestão:{" "}
                          <button
                            type="button"
                            onClick={() => setNickname(suggestion)}
                            className="underline font-mono text-indigo-300 hover:text-indigo-200"
                          >
                            {suggestion}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
              disabled={available === false}
            >
              <Gamepad2 className="w-5 h-5 mr-2" />
              Entrar na Arena
            </Button>
          </form>
        </Card>

        {/* Emojis Demonstrativos */}
        <div className="flex justify-center gap-4 text-3xl select-none opacity-80">
          <span title="Pedra">🪨</span>
          <span title="Papel">📄</span>
          <span title="Tesoura">✂️</span>
          <span title="Lagarto">🦎</span>
          <span title="Spock">🖖</span>
        </div>
      </div>
    </div>
  );
}
