import db from "@repo/db";
import Decimal from "decimal.js";
import { redis } from "@repo/redis";
import { orderbookCacheService } from "./orderbook-cache.service";

interface PriceLevel {
    price: string;
    quantity: string;
}

interface DepthSnapshot {
    bids: PriceLevel[];
    asks: PriceLevel[];
    timestamp: string;
}

const DEPTH_CACHE_TTL = 2;
const DEPTH_KEY = (marketId: string) => `depth:${marketId}`;

export const depthService = {
    async getDepth(marketId: string, levels = 20): Promise<DepthSnapshot> {
        const cached = await redis.get(DEPTH_KEY(marketId));
        if (cached) {
            const snap: DepthSnapshot = JSON.parse(cached);
            return {
                bids: snap.bids.slice(0, levels),
                asks: snap.asks.slice(0, levels),
                timestamp: snap.timestamp,
            };
        }
        return this.buildAndCache(marketId, levels);
    },

    async buildAndCache(marketId: string, levels = 50): Promise<DepthSnapshot> {
        const orders = await db.order.findMany({
            where: { marketId, status: { in: ["OPEN", "PARTIALLY_FILLED"] }, type: "LIMIT" },
            select: { side: true, price: true, remainingQty: true },
        });

        const bidsMap = new Map<string, Decimal>();
        const asksMap = new Map<string, Decimal>();

        for (const o of orders) {
            if (!o.price) continue;
            const priceStr = new Decimal(o.price.toString()).toFixed();
            const qty = new Decimal(o.remainingQty.toString());
            const map = o.side === "BUY" ? bidsMap : asksMap;
            map.set(priceStr, (map.get(priceStr) ?? new Decimal(0)).add(qty));
        }

        const toSorted = (map: Map<string, Decimal>, asc: boolean): PriceLevel[] =>
            [...map.entries()]
                .sort((a, b) => (asc ? new Decimal(a[0]).cmp(new Decimal(b[0])) : new Decimal(b[0]).cmp(new Decimal(a[0]))))
                .slice(0, levels)
                .map(([price, quantity]) => ({ price, quantity: quantity.toFixed() }));

        const snapshot: DepthSnapshot = {
            bids: toSorted(bidsMap, false),
            asks: toSorted(asksMap, true),
            timestamp: new Date().toISOString(),
        };

        await redis.setex(DEPTH_KEY(marketId), DEPTH_CACHE_TTL, JSON.stringify(snapshot));

        await redis.publish(`market:depth:${marketId}`, JSON.stringify({
            event: "depth",
            payload: snapshot,
        }));

        // Sync orderbook snapshot for WS gateway
        await orderbookCacheService.publishUpdate(marketId, {
            bids: snapshot.bids.map((b) => [b.price, b.quantity]),
            asks: snapshot.asks.map((a) => [a.price, a.quantity]),
            sequence: Date.now(),
            timestamp: snapshot.timestamp,
        });

        return snapshot;
    },

    async invalidate(marketId: string) {
        await this.buildAndCache(marketId);
    },
};
