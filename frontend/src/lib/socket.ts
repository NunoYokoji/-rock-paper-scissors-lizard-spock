import { storage } from "./storage";

export type MessageHandler = (data: any) => void;

export interface GameTransport {
  connect(matchId: string): void;
  send(message: any): void;
  subscribe(handler: MessageHandler): () => void;
  disconnect(): void;
  isConnected(): boolean;
}

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export class WebSocketTransport implements GameTransport {
  private ws: WebSocket | null = null;
  private matchId: string = "";
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: any = null;
  private isExplicitDisconnect = false;

  connect(matchId: string): void {
    this.matchId = matchId;
    this.isExplicitDisconnect = false;

    const url = `${WS_BASE}/ws/match/${matchId}/`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      const token = storage.getToken();
      if (token) {
        this.send({ type: "auth", token });
      }
      this.notify({ type: "connection.status", status: "connected" });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notify(data);
      } catch (err) {
        console.error("Erro ao ler JSON da WebSocket:", err);
      }
    };

    this.ws.onerror = () => {
      this.notify({ type: "connection.status", status: "error" });
    };

    this.ws.onclose = () => {
      this.notify({ type: "connection.status", status: "disconnected" });
      if (!this.isExplicitDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        this.reconnectTimer = setTimeout(() => {
          this.connect(this.matchId);
        }, delay);
      }
    };
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  disconnect(): void {
    this.isExplicitDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private notify(data: any): void {
    this.handlers.forEach((h) => h(data));
  }
}
