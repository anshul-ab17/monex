import Decimal from "decimal.js";
import db from "@repo/db";
import type { CandleInterval } from "@repo/db";

const INTERVAL_MINUTES: Record<CandleInterval, number> = {
    M1: 1,
    M5: 5,
    M15: 15,
    M30: 30,
    H1: 60,
    H4: 240,
    D1: 1440,
};

const ALL_INTERVALS = Object.keys(INTERVAL_MINUTES) as CandleInterval[];

function bucketTime(ts: Date, interval: CandleInterval): Date {
    const ms = INTERVAL_MINUTES[interval] * 60 * 1000;
    return new Date(Math.floor(ts.getTime() / ms) * ms);
}

export const candleService = {
    async getCandles(marketId: string, interval: CandleInterval, limit = 100) {
        return db.candle.findMany({
            where: { marketId, interval },
            orderBy: { openTime: "desc" },
            take: Math.min(limit, 500),
        });
    },

    async updateFromTrade(marketId: string, price: Decimal, qty: Decimal, tradeTime: Date) {
        await db.$transaction(async (tx) => {
            for (const interval of ALL_INTERVALS) {
                const openTime = bucketTime(tradeTime, interval);
                const closeTime = new Date(openTime.getTime() + INTERVAL_MINUTES[interval] * 60 * 1000 - 1);

                const existing = await tx.candle.findUnique({
                    where: { marketId_interval_openTime: { marketId, interval, openTime } },
                });

                if (!existing) {
                    await tx.candle.create({
                        data: {
                            marketId,
                            interval,
                            openTime,
                            closeTime,
                            open: price.toString(),
                            high: price.toString(),
                            low: price.toString(),
                            close: price.toString(),
                            volume: qty.toString(),
                        },
                    });
                } else {
                    const curHigh = new Decimal(existing.high.toString());
                    const curLow = new Decimal(existing.low.toString());
                    await tx.candle.update({
                        where: { marketId_interval_openTime: { marketId, interval, openTime } },
                        data: {
                            high: Decimal.max(curHigh, price).toString(),
                            low: Decimal.min(curLow, price).toString(),
                            close: price.toString(),
                            volume: new Decimal(existing.volume.toString()).add(qty).toString(),
                        },
                    });
                }
            }
        });
    },
};
