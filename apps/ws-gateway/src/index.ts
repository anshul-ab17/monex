import { WebSocketServer, WebSocket } from "ws";
import { createSubscriber } from "./subscriber";
import { ConnectionManager } from "./connections";

const PORT = Number(process.env.WS_GATEWAY_PORT ?? 3002);

const wss = new WebSocketServer({ port: PORT });
const connections = new ConnectionManager();

const VALID_CHANNELS = /^market:(trades|depth|ticker):[a-f0-9-]{36}$/;

const subscriber = createSubscriber(connections);

wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (raw: Buffer | string) => {
        try {
            const msg = JSON.parse(raw.toString()) as { event?: string; channel?: string };
            if (!msg.channel || !VALID_CHANNELS.test(msg.channel)) {
                ws.send(JSON.stringify({ event: "error", payload: "invalid channel" }));
                return;
            }

            if (msg.event === "subscribe") {
                connections.subscribe(msg.channel, ws);
                subscriber.ensureSubscribed(msg.channel);
                ws.send(JSON.stringify({ event: "subscribed", payload: msg.channel }));
                return;
            }

            if (msg.event === "unsubscribe") {
                connections.unsubscribe(msg.channel, ws);
                ws.send(JSON.stringify({ event: "unsubscribed", payload: msg.channel }));
                return;
            }
        } catch {
            ws.send(JSON.stringify({ event: "error", payload: "invalid message" }));
        }
    });

    ws.on("close", () => connections.unsubscribeAll(ws));

    ws.on("pong", () => {
        (ws as any).__alive = true;
    });
});

// Heartbeat: detect dead connections
const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
        if ((ws as any).__alive === false) {
            connections.unsubscribeAll(ws);
            return ws.terminate();
        }
        (ws as any).__alive = false;
        ws.ping();
    });
}, 30_000);

wss.on("close", () => clearInterval(heartbeat));

console.log(`WS Gateway listening on :${PORT}`);
