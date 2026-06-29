import Decimal from "decimal.js";
import db from "@repo/db";
import { redis } from "@repo/redis";
import { ledgerService } from "../ledger/ledger.service";
import { oracleService } from "../oracle/oracle.service";

const FUNDING_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_FUNDING_RATE = new Decimal("0.01"); // 1% cap

export const fundingService = {
    async computeFundingRate(marketId: string): Promise<Decimal> {
        const market = await db.market.findUnique({ where: { id: marketId }, select: { symbol: true } });
        if (!market) return new Decimal(0);

        // Prefer oracle mark price, fall back to ticker last price
        let markPrice: Decimal;
        const oraclePrice = await oracleService.getMarkPrice(market.symbol);
        if (oraclePrice) {
            markPrice = oraclePrice;
        } else {
            const ticker = await redis.get(`ticker:${marketId}`);
            if (!ticker) return new Decimal(0);
            const { lastPrice } = JSON.parse(ticker);
            markPrice = new Decimal(lastPrice);
        }

        // Simple funding: (mark - index) / index
        // Using 24h VWAP as index price proxy
        const h24ago = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const trades = await db.trade.findMany({
            where: { marketId, createdAt: { gte: h24ago } },
            select: { price: true, quantity: true },
        });

        if (trades.length === 0) return new Decimal(0);

        let volumeWeightedSum = new Decimal(0);
        let totalVolume = new Decimal(0);
        for (const t of trades) {
            const p = new Decimal(t.price.toString());
            const q = new Decimal(t.quantity.toString());
            volumeWeightedSum = volumeWeightedSum.add(p.mul(q));
            totalVolume = totalVolume.add(q);
        }

        if (totalVolume.isZero()) return new Decimal(0);

        const indexPrice = volumeWeightedSum.div(totalVolume);
        const rate = markPrice.sub(indexPrice).div(indexPrice);

        // Clamp to [-MAX, +MAX]
        if (rate.gt(MAX_FUNDING_RATE)) return MAX_FUNDING_RATE;
        if (rate.lt(MAX_FUNDING_RATE.neg())) return MAX_FUNDING_RATE.neg();
        return rate;
    },

    async settleFunding(marketId: string) {
        const rate = await this.computeFundingRate(marketId);
        if (rate.isZero()) return { settled: 0 };

        const market = await db.market.findUnique({ where: { id: marketId } });
        if (!market) return { settled: 0 };

        const positions = await db.position.findMany({
            where: { marketId, quantity: { not: "0" } },
        });

        let settled = 0;

        for (const pos of positions) {
            const qty = new Decimal(pos.quantity.toString());
            const payment = qty.mul(rate).abs();

            if (payment.isZero()) continue;

            // Longs pay shorts when rate > 0, shorts pay longs when rate < 0
            const isLong = pos.side === "LONG";
            const paysOut = (isLong && rate.gt(0)) || (!isLong && rate.lt(0));

            if (paysOut) {
                await ledgerService.debit(
                    pos.userId,
                    market.quoteAssetId,
                    payment,
                    `FUNDING:${marketId}:${Date.now()}`,
                    "ADJUSTMENT",
                ).catch(() => {}); // skip if insufficient balance
            } else {
                await ledgerService.credit(
                    pos.userId,
                    market.quoteAssetId,
                    payment,
                    `FUNDING:${marketId}:${Date.now()}`,
                    "ADJUSTMENT",
                );
            }

            settled++;
        }

        // Cache latest funding rate
        await redis.setex(
            `funding:${marketId}`,
            FUNDING_INTERVAL_MS / 1000,
            JSON.stringify({ rate: rate.toString(), settledAt: new Date().toISOString() }),
        );

        return { rate: rate.toString(), settled };
    },

    async getFundingRate(marketId: string) {
        const cached = await redis.get(`funding:${marketId}`);
        if (cached) return JSON.parse(cached);
        const rate = await this.computeFundingRate(marketId);
        return { rate: rate.toString(), settledAt: null };
    },
};
