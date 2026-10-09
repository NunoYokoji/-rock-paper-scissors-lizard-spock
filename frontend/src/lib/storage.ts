const TOKEN_KEY = "rpsls_token";
const NICKNAME_KEY = "rpsls_nickname";

export const storage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },

  getNickname: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(NICKNAME_KEY);
  },
  setNickname: (nickname: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(NICKNAME_KEY, nickname);
  },
  removeNickname: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(NICKNAME_KEY);
  },

  clearAll: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NICKNAME_KEY);
  },
};
