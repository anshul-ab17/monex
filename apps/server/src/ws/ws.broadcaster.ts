import type { WebSocket } from "@fastify/websocket";

type Channel = string;

class WsBroadcaster {
    private subs = new Map<Channel, Set<WebSocket>>();

    subscribe(channel: Channel, ws: WebSocket) {
        if (!this.subs.has(channel)) this.subs.set(channel, new Set());
        this.subs.get(channel)!.add(ws);
    }

    unsubscribe(channel: Channel, ws: WebSocket) {
        this.subs.get(channel)?.delete(ws);
    }

    unsubscribeAll(ws: WebSocket) {
        for (const set of this.subs.values()) set.delete(ws);
    }

    broadcast<T>(channel: Channel, event: string, payload: T) {
        const clients = this.subs.get(channel);
        if (!clients || clients.size === 0) return;
        const msg = JSON.stringify({ event, payload });
        for (const ws of clients) {
            if (ws.readyState === ws.OPEN) ws.send(msg);
        }
    }
}

export const wsBroadcaster = new WsBroadcaster();
