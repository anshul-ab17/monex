import db from "@repo/db";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { ledgerService } from "../ledger/ledger.service";

export interface CreatePredictMarketInput {
    symbol: string;
    name: string;
    resolvesAt: string;
    quoteAssetId: string;
    outcomes: { name: string; description?: string }[];
}

export const predictionService = {
    // Create a prediction market with N outcomes (each is a tradeable share)
    async create(input: CreatePredictMarketInput) {
        if (input.outcomes.length < 2) {
            throw new BadRequestError("Prediction market requires at least 2 outcomes");
        }

        const quoteAsset = await db.asset.findUnique({ where: { id: input.quoteAssetId } });
        if (!quoteAsset) throw new NotFoundError("Quote asset not found");

        // Create one Market (PREDICTION type) as the event container
        // Each outcome gets its own tradeable "YES" share — we model this
        // as a single market where each outcome is a separate Outcome row.
        // Trading uses YES/NO binary orderbooks per outcome via separate markets.
        const markets = await db.$transaction(async (tx) => {
            const createdMarkets = [];

            for (const outcome of input.outcomes) {
                const outcomeMkt = await tx.market.create({
                    data: {
                        symbol: `${input.symbol}-${outcome.name.toUpperCase().replace(/\s+/g, "_")}`,
                        name: `${input.name} — ${outcome.name}`,
                        type: "PREDICTION",
                        baseAssetId: input.quoteAssetId, // shares denominated in quote
                        quoteAssetId: input.quoteAssetId,
                        tickSize: "0.001",
                        stepSize: "1",
                        minOrderSize: "1",
                        makerFee: "0.001",
                        takerFee: "0.002",
                        resolvesAt: new Date(input.resolvesAt),
                    },
                });

                await tx.outcome.create({
                    data: {
                        marketId: outcomeMkt.id,
                        name: outcome.name,
                        description: outcome.description,
                    },
                });

                createdMarkets.push(outcomeMkt);
            }

            return createdMarkets;
        });

        return markets;
    },

    async list() {
        return db.market.findMany({
            where: { type: "PREDICTION" },
            include: { outcomes: true, baseAsset: true, quoteAsset: true },
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(marketId: string) {
        const market = await db.market.findUnique({
            where: { id: marketId },
            include: { outcomes: true, baseAsset: true, quoteAsset: true },
        });
        if (!market) throw new NotFoundError("Prediction market not found");
        return market;
    },

    // Resolve: mark the winning outcome, cancel all open orders, settle winning holders
    async resolve(marketId: string, winningOutcomeId: string) {
        const market = await db.market.findUnique({
            where: { id: marketId },
            include: { outcomes: true, quoteAsset: true },
        });

        if (!market) throw new NotFoundError("Market not found");
        if (market.type !== "PREDICTION") throw new BadRequestError("Not a prediction market");
        if (market.resolvedAt) throw new BadRequestError("Market already resolved");

        const winner = market.outcomes.find((o) => o.id === winningOutcomeId);
        if (!winner) throw new NotFoundError("Outcome not found in this market");

        // Cancel all open orders on this market
        const openOrders = await db.order.findMany({
            where: { marketId, status: { in: ["OPEN", "PARTIALLY_FILLED"] } },
            include: { market: true },
        });

        await db.$transaction(async (tx) => {
            for (const order of openOrders) {
                const remaining = order.remainingQty;
                const assetId =
                    order.side === "BUY" ? order.market.quoteAssetId : order.market.baseAssetId;

                await tx.order.update({
                    where: { id: order.id },
                    data: { status: "CANCELLED", cancelledAt: new Date() },
                });

                // Release locked funds
                await tx.balance.update({
                    where: { userId_assetId: { userId: order.userId, assetId } },
                    data: {
                        locked: { decrement: remaining.toString() },
                        available: { increment: remaining.toString() },
                    },
                });
            }

            // Mark outcomes — winner=true, others=false
            for (const outcome of market.outcomes) {
                await tx.outcome.update({
                    where: { id: outcome.id },
                    data: {
                        isWinner: outcome.id === winningOutcomeId,
                        resolvedAt: new Date(),
                    },
                });
            }

            // Mark market as resolved + inactive
            await tx.market.update({
                where: { id: marketId },
                data: { resolvedAt: new Date(), isActive: false },
            });
        });

        // Pay out winners: 1 USDC per share held (position = filledQty on BUY orders)
        const winnerTrades = await db.trade.findMany({
            where: { marketId },
            select: { buyerId: true, quantity: true },
        });

        // Aggregate by buyer
        const payouts = new Map<string, number>();
        for (const t of winnerTrades) {
            const qty = Number(t.quantity);
            payouts.set(t.buyerId, (payouts.get(t.buyerId) ?? 0) + qty);
        }

        for (const [userId, shares] of payouts) {
            if (shares > 0) {
                await ledgerService.credit(
                    userId,
                    market.quoteAssetId,
                    new (await import("decimal.js")).Decimal(shares),
                    `PREDICT_PAYOUT:${marketId}:${winningOutcomeId}`,
                );
            }
        }

        return { resolved: true, winner: winner.name, payoutsCount: payouts.size };
    },
};
