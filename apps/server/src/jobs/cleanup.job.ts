import Decimal from "decimal.js";
import db from "@repo/db";

async function expireOrders() {
    const expired = await db.order.findMany({
        where: {
            status: { in: ["PENDING", "OPEN"] },
            expiresAt: { lt: new Date() },
        },
        include: { market: true },
    });

    if (expired.length === 0) return;

    for (const order of expired) {
        const remaining = new Decimal(order.remainingQty.toString());
        if (remaining.isZero()) continue;

        const price = order.price ? new Decimal(order.price.toString()) : undefined;
        const assetId = order.side === "BUY" ? order.market.quoteAssetId : order.market.baseAssetId;
        const releaseAmt = order.side === "BUY" ? price!.mul(remaining) : remaining;

        await db.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: order.id },
                data: { status: "EXPIRED", cancelledAt: new Date() },
            });
            await tx.balance.update({
                where: { userId_assetId: { userId: order.userId, assetId } },
                data: {
                    locked: { decrement: releaseAmt.toString() },
                    available: { increment: releaseAmt.toString() },
                },
            });
            await tx.orderEvent.create({
                data: { orderId: order.id, eventType: "EXPIRED", remainingQty: remaining.toString() },
            });
        });
    }

    console.log(`[cleanup] expired ${expired.length} orders`);
}

export function startCleanupJob() {
    // Run immediately on start, then every 60 seconds
    expireOrders().catch((err) => console.error("[cleanup] error:", err));
    setInterval(() => {
        expireOrders().catch((err) => console.error("[cleanup] error:", err));
    }, 60_000);
}
