import db from "@repo/db";

async function expirePredictionMarkets() {
    const expired = await db.market.findMany({
        where: {
            type: "PREDICTION",
            isActive: true,
            resolvedAt: null,
            resolvesAt: { lt: new Date() },
        },
        include: { outcomes: true },
    });

    if (expired.length === 0) return;

    for (const market of expired) {
        // Cancel all open orders and release locked funds
        const openOrders = await db.order.findMany({
            where: { marketId: market.id, status: { in: ["OPEN", "PARTIALLY_FILLED"] } },
            include: { market: true },
        });

        await db.$transaction(async (tx) => {
            for (const order of openOrders) {
                const assetId =
                    order.side === "BUY" ? order.market.quoteAssetId : order.market.baseAssetId;

                await tx.order.update({
                    where: { id: order.id },
                    data: { status: "EXPIRED", cancelledAt: new Date() },
                });

                await tx.balance.update({
                    where: { userId_assetId: { userId: order.userId, assetId } },
                    data: {
                        locked: { decrement: order.remainingQty.toString() },
                        available: { increment: order.remainingQty.toString() },
                    },
                });
            }

            // Mark all outcomes as unresolved, market as inactive
            for (const outcome of market.outcomes) {
                await tx.outcome.update({
                    where: { id: outcome.id },
                    data: { isWinner: false, resolvedAt: new Date() },
                });
            }

            await tx.market.update({
                where: { id: market.id },
                data: { isActive: false, resolvedAt: new Date() },
            });
        });

        console.log(`[prediction-expiry] expired market ${market.symbol} (${market.id})`);
    }
}

export function startPredictionExpiryJob() {
    expirePredictionMarkets().catch((err) => console.error("[prediction-expiry] error:", err));
    setInterval(() => {
        expirePredictionMarkets().catch((err) => console.error("[prediction-expiry] error:", err));
    }, 60_000);
}
