import type { WebSocket } from "ws";

export type WireFormat = "json" | "proto";

interface ClientMeta {
    ws: WebSocket;
    format: WireFormat;
}

export class ConnectionManager {
    private subs = new Map<string, Set<ClientMeta>>();
    private clientFormats = new Map<WebSocket, WireFormat>();

    subscribe(channel: string, ws: WebSocket) {
        if (!this.subs.has(channel)) this.subs.set(channel, new Set());
        const format = this.clientFormats.get(ws) ?? "json";
        this.subs.get(channel)!.add({ ws, format });
    }

    unsubscribe(channel: string, ws: WebSocket) {
        const clients = this.subs.get(channel);
        if (!clients) return;
        for (const c of clients) {
            if (c.ws === ws) { clients.delete(c); break; }
        }
    }

    unsubscribeAll(ws: WebSocket) {
        for (const set of this.subs.values()) {
            for (const c of set) {
                if (c.ws === ws) set.delete(c);
            }
        }
        this.clientFormats.delete(ws);
    }

    setFormat(ws: WebSocket, format: WireFormat) {
        this.clientFormats.set(ws, format);
    }

    broadcast(channel: string, jsonMessage: string, protoMessage?: Uint8Array) {
        const clients = this.subs.get(channel);
        if (!clients || clients.size === 0) return;
        for (const { ws, format } of clients) {
            if (ws.readyState !== ws.OPEN) continue;
            if (format === "proto" && protoMessage) {
                ws.send(protoMessage);
            } else {
                ws.send(jsonMessage);
            }
        }
    }

    channelCount(): number {
        return this.subs.size;
    }

    clientCount(): number {
        const all = new Set<WebSocket>();
        for (const set of this.subs.values()) {
            for (const { ws } of set) all.add(ws);
        }
        return all.size;
    }
}
