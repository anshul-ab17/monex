import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import { wsBroadcaster } from "./ws.broadcaster";
import { startWsRedisBridge } from "./ws.redis-bridge";

const VALID_PUBLIC_CHANNELS = /^market:(trades|depth|ticker|orderbook|candle):[a-f0-9-]{36}$/;
const USER_CHANNEL_PREFIX = "user:";

let bridgeStarted = false;

export async function wsRoutes(app: FastifyInstance) {
    if (!bridgeStarted) {
        startWsRedisBridge();
        bridgeStarted = true;
    }

    app.get("/ws", { websocket: true }, (socket: WebSocket) => {
        let authenticatedUserId: string | null = null;

        socket.on("message", (raw: Buffer | string) => {
            try {
                const msg = JSON.parse(raw.toString()) as {
                    event?: string;
                    channel?: string;
                    token?: string;
                };

                // Authenticate for user-specific channels
                if (msg.event === "auth" && msg.token) {
                    try {
                        const decoded = app.jwt.verify<{ sub: string }>(msg.token);
                        authenticatedUserId = decoded.sub;
                        socket.send(JSON.stringify({ event: "authenticated", payload: { userId: authenticatedUserId } }));
                    } catch {
                        socket.send(JSON.stringify({ event: "error", payload: "invalid token" }));
                    }
                    return;
                }

                // Ping/pong keepalive
                if (msg.event === "ping") {
                    socket.send(JSON.stringify({ event: "pong", payload: Date.now() }));
                    return;
                }

                const channel = msg.channel;
                if (!channel) {
                    socket.send(JSON.stringify({ event: "error", payload: "missing channel" }));
                    return;
                }

                const isPublic = VALID_PUBLIC_CHANNELS.test(channel);
                const isUserChannel = channel.startsWith(USER_CHANNEL_PREFIX);

                if (!isPublic && !isUserChannel) {
                    socket.send(JSON.stringify({ event: "error", payload: "invalid channel" }));
                    return;
                }

                if (isUserChannel) {
                    if (!authenticatedUserId) {
                        socket.send(JSON.stringify({ event: "error", payload: "auth required for user channels" }));
                        return;
                    }
                    const channelUserId = channel.slice(USER_CHANNEL_PREFIX.length);
                    if (channelUserId !== authenticatedUserId) {
                        socket.send(JSON.stringify({ event: "error", payload: "cannot subscribe to another user's channel" }));
                        return;
                    }
                }

                if (msg.event === "subscribe") {
                    wsBroadcaster.subscribe(channel, socket);
                    socket.send(JSON.stringify({ event: "subscribed", payload: channel }));
                    return;
                }

                if (msg.event === "unsubscribe") {
                    wsBroadcaster.unsubscribe(channel, socket);
                    socket.send(JSON.stringify({ event: "unsubscribed", payload: channel }));
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
