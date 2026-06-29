import Decimal from "decimal.js";
import db from "@repo/db";
import { marginService } from "../margin/margin.service";
import { positionService } from "../position/position.service";
import { ledgerService } from "../ledger/ledger.service";

export interface LiquidationResult {
    userId: string;
    marketId: string;
    positionId: string;
    side: string;
    liquidationPrice: string;
    markPrice: string;
    closedQty: string;
    realizedLoss: string;
}

export const liquidationService = {
    async checkAndLiquidate(): Promise<LiquidationResult[]> {
        const underwater = await marginService.getUnderwaterPositions();
        const results: LiquidationResult[] = [];

        for (const pos of underwater) {
            try {
                const result = await this.liquidatePosition(pos);
                if (result) results.push(result);
            } catch (err) {
                console.error(`[liquidation] failed for position ${pos.positionId}:`, err);
            }
        }

        return results;
    },

    async liquidatePosition(pos: {
        marginAccountId: string;
        userId: string;
        marketId: string;
        positionId: string;
        side: string;
        liquidationPrice: Decimal;
        markPrice: Decimal;
    }): Promise<LiquidationResult | null> {
        const position = await db.position.findUnique({ where: { id: pos.positionId } });
        if (!position || new Decimal(position.quantity.toString()).isZero()) return null;

        const market = await db.market.findUnique({ where: { id: pos.marketId } });
        if (!market) return null;

        const qty = new Decimal(position.quantity.toString());
        const entryPrice = new Decimal(position.avgEntryPrice.toString());
        const exitPrice = pos.markPrice;

        // Close position at mark price
        await positionService.closePosition({
            userId: pos.userId,
            marketId: pos.marketId,
            side: pos.side as "LONG" | "SHORT",
            quantity: qty,
            exitPrice,
        });

        // Seize margin — transfer locked margin to system fees
        const marginAccount = await db.marginAccount.findUnique({
            where: { id: pos.marginAccountId },
        });

        if (marginAccount) {
            const margin = new Decimal(marginAccount.margin.toString());

            // Release locked margin, deduct it as liquidation penalty
            await db.$transaction(async (tx) => {
                await tx.balance.update({
                    where: { userId_assetId: { userId: pos.userId, assetId: market.quoteAssetId } },
                    data: { locked: { decrement: margin.toString() } },
                });

                await tx.marginAccount.update({
                    where: { id: pos.marginAccountId },
                    data: { margin: "0", liquidationPrice: null },
                });
            });

            // Credit insurance fund / system fees
            await ledgerService.credit(
                "SYSTEM",
                market.quoteAssetId,
                margin,
                `LIQUIDATION:${pos.positionId}:${Date.now()}`,
                "ADJUSTMENT",
            ).catch(() => {});
        }

        // Cancel any open orders for this user+market
        const openOrders = await db.order.findMany({
            where: { userId: pos.userId, marketId: pos.marketId, status: { in: ["OPEN", "PARTIALLY_FILLED"] } },
            include: { market: true },
        });

        for (const order of openOrders) {
            const assetId = order.side === "BUY" ? order.market.quoteAssetId : order.market.baseAssetId;
            const remaining = new Decimal(order.remainingQty.toString());
            const price = order.price ? new Decimal(order.price.toString()) : new Decimal(0);
            const releaseAmt = order.side === "BUY" ? price.mul(remaining) : remaining;

            await db.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: "CANCELLED", cancelledAt: new Date() },
                });
                await tx.balance.update({
                    where: { userId_assetId: { userId: pos.userId, assetId } },
                    data: {
                        locked: { decrement: releaseAmt.toString() },
                        available: { increment: releaseAmt.toString() },
                    },
                }).catch(() => {});
            });
        }

        const diff = exitPrice.sub(entryPrice);
        const realizedLoss = pos.side === "LONG" ? diff.mul(qty) : diff.neg().mul(qty);

        return {
            userId: pos.userId,
            marketId: pos.marketId,
            positionId: pos.positionId,
            side: pos.side,
            liquidationPrice: pos.liquidationPrice.toString(),
            markPrice: pos.markPrice.toString(),
            closedQty: qty.toString(),
            realizedLoss: realizedLoss.toString(),
        };
    },
};
