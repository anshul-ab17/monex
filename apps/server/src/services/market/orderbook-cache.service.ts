import { redis } from "@repo/redis";

const OB_KEY = (marketId: string) => `orderbook:snapshot:${marketId}`;
const OB_TTL = 5;

interface OrderbookSnapshot {
    bids: Array<[string, string]>; // [price, qty]
    asks: Array<[string, string]>;
    sequence: number;
    timestamp: string;
}

export const orderbookCacheService = {
    async setSnapshot(marketId: string, snapshot: OrderbookSnapshot) {
        await redis.setex(OB_KEY(marketId), OB_TTL, JSON.stringify(snapshot));
    },

    async getSnapshot(marketId: string): Promise<OrderbookSnapshot | null> {
        const raw = await redis.get(OB_KEY(marketId));
        return raw ? JSON.parse(raw) : null;
    },

    async publishUpdate(marketId: string, snapshot: OrderbookSnapshot) {
        await this.setSnapshot(marketId, snapshot);
        await redis.publish(
            `market:orderbook:${marketId}`,
            JSON.stringify({ event: "orderbook", payload: snapshot }),
        );
    },
};
