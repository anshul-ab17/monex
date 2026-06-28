import Redis from "ioredis";
import type { ConnectionManager } from "./connections";
import { encodeEnvelope } from "@repo/proto";

const EVENT_TO_PROTO: Record<string, string> = {
    trade: "TradeExecuted",
    depth: "DepthSnapshot",
    ticker: "TickerUpdate",
    candle: "Candle",
};

export function createSubscriber(connections: ConnectionManager) {
    const sub = new Redis(process.env.REDIS_URL!, { lazyConnect: true });
    const subscribedChannels = new Set<string>();

    sub.connect().catch((err) => {
        console.error("Redis subscriber connect failed:", err);
    });

    sub.on("message", async (channel: string, message: string) => {
        let protoBytes: Uint8Array | undefined;
        try {
            const parsed = JSON.parse(message);
            const protoType = EVENT_TO_PROTO[parsed.event];
            if (protoType && parsed.payload) {
                protoBytes = await encodeEnvelope(parsed.event, protoType, parsed.payload);
            }
        } catch {
            // proto encoding failed — send JSON only
        }
        connections.broadcast(channel, message, protoBytes);
    });

    return {
        ensureSubscribed(channel: string) {
            if (subscribedChannels.has(channel)) return;
            subscribedChannels.add(channel);
            sub.subscribe(channel).catch((err) => {
                console.error(`Failed to subscribe to ${channel}:`, err);
                subscribedChannels.delete(channel);
            });
        },
    };
}
