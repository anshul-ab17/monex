type MessageHandler = (data: unknown) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private subs = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      for (const channel of this.subs.keys()) {
        this.send({ event: "subscribe", channel });
      }
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.channel && msg.payload) {
          const handlers = this.subs.get(msg.channel);
          if (handlers) {
            for (const h of handlers) h(msg.payload);
          }
        }
      } catch {}
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        this.connect();
      }, this.reconnectDelay);
    };
  }

  private send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(channel: string, handler: MessageHandler) {
    if (!this.subs.has(channel)) {
      this.subs.set(channel, new Set());
      this.send({ event: "subscribe", channel });
    }
    this.subs.get(channel)!.add(handler);

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    }
  }

  unsubscribe(channel: string, handler: MessageHandler) {
    const handlers = this.subs.get(channel);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.subs.delete(channel);
      this.send({ event: "unsubscribe", channel });
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

// ponytail: singleton, upgrade to per-connection if multi-server needed
export const wsManager = new WebSocketManager(
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
    : "ws://localhost:3001/ws"
);
