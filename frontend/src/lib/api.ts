import { storage } from "./storage";
import type {
  AuthResponse,
  MatchData,
  PlayerProfile,
  RulesResponse,
} from "@/features/game/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = storage.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.detail || `Erro (${res.status})`);
  }

  return data as T;
}

export const api = {
  guestLogin: (nickname: string) =>
    request<AuthResponse>("/api/auth/guest", {
      method: "POST",
      body: JSON.stringify({ nickname }),
    }),

  getMe: () => request<PlayerProfile>("/api/auth/me"),

  checkNickname: (q: string) =>
    request<{ available: boolean; suggestion: string | null }>(
      `/api/nicknames/check?q=${encodeURIComponent(q)}`
    ),

  getRules: () => request<RulesResponse>("/api/rules"),

  createMatch: (mode: "quick" | "private" | "bot", best_of: 3 | 5 = 3) =>
    request<MatchData>("/api/matches", {
      method: "POST",
      body: JSON.stringify({ mode, best_of }),
    }),

  joinMatch: (code: string) =>
    request<MatchData>("/api/matches/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  getLeaderboard: () => request<PlayerProfile[]>("/api/leaderboard"),
};
