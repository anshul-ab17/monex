import Redis from "ioredis";
import type { ConnectionManager } from "./connections";

export function createSubscriber(connections: ConnectionManager) {
    const sub = new Redis(process.env.REDIS_URL!, { lazyConnect: true });
    const subscribedChannels = new Set<string>();

    sub.connect().catch((err) => {
        console.error("Redis subscriber connect failed:", err);
    });

    sub.on("message", (channel: string, message: string) => {
        connections.broadcast(channel, message);
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
