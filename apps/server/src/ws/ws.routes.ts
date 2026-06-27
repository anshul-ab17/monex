import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import { wsBroadcaster } from "./ws.broadcaster";

const VALID_CHANNELS = /^market:(trades|depth|ticker):[a-f0-9-]{36}$/;

export async function wsRoutes(app: FastifyInstance) {
    app.get("/ws", { websocket: true }, (socket: WebSocket) => {
        socket.on("message", (raw: Buffer | string) => {
            try {
                const msg = JSON.parse(raw.toString()) as { event?: string; channel?: string };
                if (!msg.channel || !VALID_CHANNELS.test(msg.channel)) {
                    socket.send(JSON.stringify({ event: "error", payload: "invalid channel" }));
                    return;
                }

                if (msg.event === "subscribe") {
                    wsBroadcaster.subscribe(msg.channel, socket);
                    socket.send(JSON.stringify({ event: "subscribed", payload: msg.channel }));
                    return;
                }

                if (msg.event === "unsubscribe") {
                    wsBroadcaster.unsubscribe(msg.channel, socket);
                    socket.send(JSON.stringify({ event: "unsubscribed", payload: msg.channel }));
                    return;
                }
            } catch {
                socket.send(JSON.stringify({ event: "error", payload: "invalid message" }));
            }
        });

        socket.on("close", () => {
            wsBroadcaster.unsubscribeAll(socket);
        });
    });
}
