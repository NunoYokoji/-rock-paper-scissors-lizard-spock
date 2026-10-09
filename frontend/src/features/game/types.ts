export type MoveType = "rock" | "paper" | "scissors" | "lizard" | "spock";

export interface MoveInfo {
  id: MoveType;
  label: string;
  icon: string;
}

export interface RuleItem {
  order: number;
  winner: MoveType;
  verb: string;
  loser: MoveType;
}

export interface RulesResponse {
  moves: MoveInfo[];
  rules: RuleItem[];
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  wins?: number;
  losses?: number;
  draws?: number;
  matches_played?: number;
  win_rate?: number;
}

export interface AuthResponse {
  player: PlayerProfile;
  token: string;
}

export interface MatchData {
  id: string;
  code: string | null;
  mode: "quick" | "private" | "bot";
  best_of: 3 | 5;
  status: "waiting" | "playing" | "finished" | "abandoned";
  player_one: PlayerProfile;
  player_two: PlayerProfile | null;
  winner: string | null;
  created_at: string;
}

export interface RoundResultData {
  round_number: number;
  choices: Record<string, MoveType>;
  winner: string | null;
  rule: {
    winner: MoveType;
    verb: string;
    loser: MoveType;
  } | null;
}

export interface MatchFinishedData {
  winner: string | null;
  score: {
    player_one: number;
    player_two: number;
  };
}

export interface MatchStateData {
  match_id: string;
  code: string | null;
  mode: "quick" | "private" | "bot";
  best_of: number;
  status: string;
  player_one: PlayerProfile;
  player_two: PlayerProfile | null;
  score: { player_one: number; player_two: number };
  rounds: Array<{
    number: number;
    winner: string | null;
    resolved: boolean;
    moves: Record<string, string>;
  }>;
  winner: string | null;
}
