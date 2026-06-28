import Decimal from "decimal.js";
import db from "@repo/db";
import { redis } from "@repo/redis";

export interface TickerData {
    marketId: string;
    lastPrice: string;
    volume24h: string;
    high24h: string;
    low24h: string;
    change24h: string;
    changePercent24h: string;
}

const TICKER_TTL = 5;

export const tickerService = {
    async getTicker(marketId: string): Promise<TickerData | null> {
        const cached = await redis.get(`ticker:${marketId}`);
        if (cached) return JSON.parse(cached);

        const ticker = await this.computeTicker(marketId);
        if (ticker) {
            await redis.setex(`ticker:${marketId}`, TICKER_TTL, JSON.stringify(ticker));
        }
        return ticker;
    },

    async computeTicker(marketId: string): Promise<TickerData | null> {
        const now = new Date();
        const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [lastTrade, stats] = await Promise.all([
            db.trade.findFirst({
                where: { marketId },
                orderBy: { createdAt: "desc" },
                select: { price: true },
            }),
            db.trade.aggregate({
                where: { marketId, createdAt: { gte: h24ago } },
                _sum: { quantity: true },
                _max: { price: true },
                _min: { price: true },
            }),
        ]);

        if (!lastTrade) return null;

        const openTrade = await db.trade.findFirst({
            where: { marketId, createdAt: { gte: h24ago } },
            orderBy: { createdAt: "asc" },
            select: { price: true },
        });

        const lastPrice = new Decimal(lastTrade.price.toString());
        const openPrice = openTrade
            ? new Decimal(openTrade.price.toString())
            : lastPrice;
        const change = lastPrice.sub(openPrice);
        const changePercent = openPrice.isZero()
            ? new Decimal(0)
            : change.div(openPrice).mul(100);

        return {
            marketId,
            lastPrice: lastPrice.toString(),
            volume24h: stats._sum.quantity?.toString() ?? "0",
            high24h: stats._max.price?.toString() ?? lastPrice.toString(),
            low24h: stats._min.price?.toString() ?? lastPrice.toString(),
            change24h: change.toString(),
            changePercent24h: changePercent.toFixed(2),
        };
    },

    async publishTicker(marketId: string) {
        const ticker = await this.computeTicker(marketId);
        if (!ticker) return;
        await redis.setex(`ticker:${marketId}`, TICKER_TTL, JSON.stringify(ticker));
        await redis.publish(
            `market:ticker:${marketId}`,
            JSON.stringify({ event: "ticker", payload: ticker }),
        );
    },
};
