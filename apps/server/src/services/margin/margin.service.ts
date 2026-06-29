import Decimal from "decimal.js";
import db from "@repo/db";
import { BadRequestError, NotFoundError, InsufficientBalanceError } from "../../utils/errors";
import { oracleService } from "../oracle/oracle.service";

const MAX_LEVERAGE = 20;
const MIN_MARGIN_RATIO = new Decimal("0.05"); // 5% maintenance margin

export const marginService = {
    async openIsolatedMargin(input: {
        userId: string;
        marketId: string;
        positionId: string;
        margin: Decimal;
        leverage: number;
        side: "LONG" | "SHORT";
        entryPrice: Decimal;
    }) {
        const { userId, marketId, positionId, margin, leverage, side, entryPrice } = input;

        if (leverage < 1 || leverage > MAX_LEVERAGE) {
            throw new BadRequestError(`Leverage must be 1-${MAX_LEVERAGE}`);
        }

        const market = await db.market.findUnique({ where: { id: marketId } });
        if (!market || market.type !== "PERPETUAL") {
            throw new BadRequestError("Isolated margin only for PERPETUAL markets");
        }

        const liqPrice = this.computeLiquidationPrice(entryPrice, margin, leverage, side);

        // Lock margin from available balance
        const quoteAssetId = market.quoteAssetId;
        await db.$transaction(async (tx) => {
            const balance = await tx.balance.findUnique({
                where: { userId_assetId: { userId, assetId: quoteAssetId } },
            });
            if (!balance || new Decimal(balance.available.toString()).lt(margin)) {
                throw new InsufficientBalanceError();
            }

            await tx.balance.update({
                where: { userId_assetId: { userId, assetId: quoteAssetId } },
                data: {
                    available: { decrement: margin.toString() },
                    locked: { increment: margin.toString() },
                },
            });

            await tx.marginAccount.create({
                data: {
                    userId,
                    marketId,
                    positionId,
                    margin: margin.toString(),
                    leverage,
                    liquidationPrice: liqPrice.toString(),
                },
            });
        });

        return { positionId, margin: margin.toString(), leverage, liquidationPrice: liqPrice.toString() };
    },

    async addMargin(userId: string, marketId: string, amount: Decimal) {
        const account = await db.marginAccount.findUnique({
            where: { userId_marketId: { userId, marketId } },
            include: { position: true, market: true },
        });
        if (!account) throw new NotFoundError("Margin account not found");

        const quoteAssetId = account.market.quoteAssetId;

        await db.$transaction(async (tx) => {
            const balance = await tx.balance.findUnique({
                where: { userId_assetId: { userId, assetId: quoteAssetId } },
            });
            if (!balance || new Decimal(balance.available.toString()).lt(amount)) {
                throw new InsufficientBalanceError();
            }

            await tx.balance.update({
                where: { userId_assetId: { userId, assetId: quoteAssetId } },
                data: {
                    available: { decrement: amount.toString() },
                    locked: { increment: amount.toString() },
                },
            });

            const newMargin = new Decimal(account.margin.toString()).add(amount);
            const entryPrice = new Decimal(account.position.avgEntryPrice.toString());
            const side = account.position.side as "LONG" | "SHORT";
            const liqPrice = this.computeLiquidationPrice(entryPrice, newMargin, account.leverage, side);

            await tx.marginAccount.update({
                where: { id: account.id },
                data: { margin: newMargin.toString(), liquidationPrice: liqPrice.toString() },
            });
        });
    },

    async getMarginAccount(userId: string, marketId: string) {
        const account = await db.marginAccount.findUnique({
            where: { userId_marketId: { userId, marketId } },
            include: { position: true, market: { select: { symbol: true } } },
        });
        if (!account) return null;

        const markPrice = await oracleService.getMarkPrice(account.market.symbol);
        const entryPrice = new Decimal(account.position.avgEntryPrice.toString());
        const qty = new Decimal(account.position.quantity.toString());
        const margin = new Decimal(account.margin.toString());

        let unrealizedPnl = new Decimal(0);
        if (markPrice && !qty.isZero()) {
            const diff = markPrice.sub(entryPrice);
            unrealizedPnl = account.position.side === "LONG" ? diff.mul(qty) : diff.neg().mul(qty);
        }

        const equity = margin.add(unrealizedPnl);
        const positionValue = markPrice ? markPrice.mul(qty) : entryPrice.mul(qty);
        const marginRatio = positionValue.isZero() ? new Decimal(1) : equity.div(positionValue);

        return {
            ...account,
            unrealizedPnl: unrealizedPnl.toString(),
            equity: equity.toString(),
            marginRatio: marginRatio.toString(),
            markPrice: markPrice?.toString() ?? null,
        };
    },

    computeLiquidationPrice(
        entryPrice: Decimal,
        margin: Decimal,
        leverage: number,
        side: "LONG" | "SHORT",
    ): Decimal {
        // Liq price = entry ± (margin / (qty_notional / entry))
        // Simplified: for LONG, liq = entry * (1 - 1/leverage + maintenance)
        //             for SHORT, liq = entry * (1 + 1/leverage - maintenance)
        const maintenanceMargin = MIN_MARGIN_RATIO;
        if (side === "LONG") {
            return entryPrice.mul(new Decimal(1).sub(new Decimal(1).div(leverage)).add(maintenanceMargin));
        }
        return entryPrice.mul(new Decimal(1).add(new Decimal(1).div(leverage)).sub(maintenanceMargin));
    },

    async getUnderwaterPositions(): Promise<Array<{
        marginAccountId: string;
        userId: string;
        marketId: string;
        positionId: string;
        side: string;
        liquidationPrice: Decimal;
        markPrice: Decimal;
    }>> {
        const accounts = await db.marginAccount.findMany({
            where: { liquidationPrice: { not: null } },
            include: { position: true, market: { select: { symbol: true } } },
        });

        const underwater = [];
        for (const acc of accounts) {
            if (new Decimal(acc.position.quantity.toString()).isZero()) continue;

            const markPrice = await oracleService.getMarkPrice(acc.market.symbol);
            if (!markPrice) continue;

            const liqPrice = new Decimal(acc.liquidationPrice!.toString());
            const side = acc.position.side;

            const isLiquidatable =
                (side === "LONG" && markPrice.lte(liqPrice)) ||
                (side === "SHORT" && markPrice.gte(liqPrice));

            if (isLiquidatable) {
                underwater.push({
                    marginAccountId: acc.id,
                    userId: acc.userId,
                    marketId: acc.marketId,
                    positionId: acc.positionId,
                    side,
                    liquidationPrice: liqPrice,
                    markPrice,
                });
            }
        }

        return underwater;
    },
};
