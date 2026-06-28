import type { WebSocket } from "ws";

export class ConnectionManager {
    private subs = new Map<string, Set<WebSocket>>();

    subscribe(channel: string, ws: WebSocket) {
        if (!this.subs.has(channel)) this.subs.set(channel, new Set());
        this.subs.get(channel)!.add(ws);
    }

    unsubscribe(channel: string, ws: WebSocket) {
        this.subs.get(channel)?.delete(ws);
    }

    unsubscribeAll(ws: WebSocket) {
        for (const set of this.subs.values()) set.delete(ws);
    }

    broadcast(channel: string, message: string) {
        const clients = this.subs.get(channel);
        if (!clients || clients.size === 0) return;
        for (const ws of clients) {
            if (ws.readyState === ws.OPEN) ws.send(message);
        }
    }

    channelCount(): number {
        return this.subs.size;
    }

    clientCount(): number {
        const all = new Set<WebSocket>();
        for (const set of this.subs.values()) {
            for (const ws of set) all.add(ws);
        }
        return all.size;
    }
}
