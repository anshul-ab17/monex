import { Redis } from "@repo/redis";
import { wsBroadcaster } from "./ws.broadcaster";

let subscriber: InstanceType<typeof Redis> | null = null;

export function startWsRedisBridge() {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    subscriber = new Redis(redisUrl);

    subscriber.on("pmessage", (_pattern: string, channel: string, message: string) => {
        try {
            const parsed = JSON.parse(message);
            wsBroadcaster.broadcast(channel, parsed.event ?? "update", parsed.payload ?? parsed);
        } catch {
            // non-JSON, skip
        }
    });

    const patterns = [
        "market:trades:*",
        "market:depth:*",
        "market:ticker:*",
        "market:candle:*",
        "market:orderbook:*",
        "user:*",
    ];

    for (const pattern of patterns) {
        subscriber.psubscribe(pattern).catch(() => {});
    }

    console.log("[ws-bridge] Redis → WS bridge started");
}

export function stopWsRedisBridge() {
    subscriber?.disconnect();
    subscriber = null;
}
