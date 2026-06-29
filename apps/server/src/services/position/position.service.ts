import Decimal from "decimal.js";
import db from "@repo/db";

export const positionService = {
    async updateFromTrade(input: {
        userId: string;
        marketId: string;
        side: "BUY" | "SELL";
        quantity: Decimal;
        price: Decimal;
    }) {
        const { userId, marketId, side, quantity, price } = input;
        const positionSide = side === "BUY" ? "LONG" : "SHORT";

        const existing = await db.position.findUnique({
            where: { userId_marketId_side: { userId, marketId, side: positionSide } },
        });

        if (!existing) {
            await db.position.create({
                data: {
                    userId,
                    marketId,
                    side: positionSide,
                    quantity: quantity.toString(),
                    avgEntryPrice: price.toString(),
                    realizedPnl: "0",
                },
            });
            return;
        }

        const existingQty = new Decimal(existing.quantity.toString());
        const existingAvg = new Decimal(existing.avgEntryPrice.toString());
        const newQty = existingQty.add(quantity);

        // Weighted average entry price
        const newAvg = existingAvg
            .mul(existingQty)
            .add(price.mul(quantity))
            .div(newQty);

        await db.position.update({
            where: { userId_marketId_side: { userId, marketId, side: positionSide } },
            data: {
                quantity: newQty.toString(),
                avgEntryPrice: newAvg.toString(),
            },
        });
    },

    async closePosition(input: {
        userId: string;
        marketId: string;
        side: "LONG" | "SHORT";
        quantity: Decimal;
        exitPrice: Decimal;
    }) {
        const { userId, marketId, side, quantity, exitPrice } = input;

        const existing = await db.position.findUnique({
            where: { userId_marketId_side: { userId, marketId, side } },
        });

        if (!existing) return;

        const existingQty = new Decimal(existing.quantity.toString());
        const avgEntry = new Decimal(existing.avgEntryPrice.toString());
        const closeQty = Decimal.min(quantity, existingQty);

        const diff = exitPrice.sub(avgEntry);
        const pnl = side === "LONG" ? diff.mul(closeQty) : diff.neg().mul(closeQty);
        const newRealized = new Decimal(existing.realizedPnl.toString()).add(pnl);
        const remainingQty = existingQty.sub(closeQty);

        if (remainingQty.isZero()) {
            await db.position.update({
                where: { userId_marketId_side: { userId, marketId, side } },
                data: { quantity: "0", realizedPnl: newRealized.toString() },
            });
        } else {
            await db.position.update({
                where: { userId_marketId_side: { userId, marketId, side } },
                data: {
                    quantity: remainingQty.toString(),
                    realizedPnl: newRealized.toString(),
                },
            });
        }
    },

    async getPositions(userId: string) {
        return db.position.findMany({
            where: { userId },
            include: { market: { select: { symbol: true } } },
        });
    },
};
