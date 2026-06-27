import Decimal from "decimal.js";
import db from "@repo/db";
import { orderBookStore, type BookOrder } from "./orderbook/index";
import { enginePublisher } from "./publisher";
import type { OrderCreatedPayload } from "@repo/events";

export async function handleOrderCreated(payload: OrderCreatedPayload) {
    const order = await db.order.findUnique({
        where: { id: payload.orderId },
        include: { market: { include: { baseAsset: true, quoteAsset: true } } },
    });
    if (!order || order.status !== "PENDING") return;

    // Engine only handles LIMIT; MARKET orders are rejected at API layer
    if (order.type !== "LIMIT" || !order.price) {
        await db.order.update({ where: { id: order.id }, data: { status: "REJECTED" } });
        await enginePublisher.orderRejected(order.id, order.userId, order.marketId);
        return;
    }

    const price = new Decimal(order.price.toString());
    const remainingQty = new Decimal(order.remainingQty.toString());
    const book = orderBookStore.get(order.marketId);

    const bookOrder: BookOrder = {
        orderId: order.id,
        userId: order.userId,
        marketId: order.marketId,
        side: order.side as "BUY" | "SELL",
        price,
        remainingQty,
        sequenceNumber: order.sequenceNumber,
        timeInForce: order.timeInForce,
        postOnly: order.postOnly,
    };

    if (order.postOnly && book.wouldMatch(bookOrder)) {
        await reject(order.id, order.userId, order.marketId, order.side, order.market.quoteAssetId, order.market.baseAssetId, price, remainingQty);
        return;
    }

    const matches = book.match(bookOrder);

    if (matches.length === 0) {
        if (order.timeInForce === "IOC" || order.timeInForce === "FOK") {
            await reject(order.id, order.userId, order.marketId, order.side, order.market.quoteAssetId, order.market.baseAssetId, price, remainingQty);
            return;
        }
        book.add(bookOrder);
        await db.order.update({ where: { id: order.id }, data: { status: "OPEN" } });
        await enginePublisher.orderAccepted(order.id, order.userId, order.marketId);
        return;
    }

    // Process each match
    let takerRemaining = remainingQty;

    for (const match of matches) {
        takerRemaining = takerRemaining.sub(match.quantity);
        const tradeId = crypto.randomUUID();

        const isTakerBuy = order.side === "BUY";
        const buyOrderId = isTakerBuy ? order.id : match.makerOrderId;
        const sellOrderId = isTakerBuy ? match.makerOrderId : order.id;
        const buyerId = isTakerBuy ? order.userId : match.makerUserId;
        const sellerId = isTakerBuy ? match.makerUserId : order.userId;

        await db.trade.create({
            data: {
                id: tradeId,
                marketId: order.marketId,
                buyerId,
                sellerId,
                buyOrderId,
                sellOrderId,
                takerSide: order.side,
                price: match.price.toString(),
                quantity: match.quantity.toString(),
                fee: "0", // ponytail: fee calc deferred
            },
        });

        // Update maker order in DB
        const makerNewRemaining = match.makerRemainingQtyBefore.sub(match.quantity);
        const makerRow = await db.order.findUnique({
            where: { id: match.makerOrderId },
            select: { filledQty: true },
        });
        await db.order.update({
            where: { id: match.makerOrderId },
            data: {
                remainingQty: makerNewRemaining.toString(),
                filledQty: new Decimal(makerRow!.filledQty.toString()).add(match.quantity).toString(),
                status: makerNewRemaining.isZero() ? "FILLED" : "PARTIALLY_FILLED",
            },
        });

        await enginePublisher.tradeExecuted({ tradeId, buyOrderId, sellOrderId, buyerId, sellerId, quantity: match.quantity.toString(), price: match.price.toString() });
    }

    book.applyMatches(matches, order.side as "BUY" | "SELL");

    const takerFilledQty = remainingQty.sub(takerRemaining);
    const takerFilled = takerRemaining.isZero();

    if (takerFilled) {
        await db.order.update({
            where: { id: order.id },
            data: { remainingQty: "0", filledQty: takerFilledQty.toString(), status: "FILLED" },
        });
        await enginePublisher.orderFilled(order.id, order.userId, order.marketId);
        return;
    }

    if (order.timeInForce === "GTC") {
        await db.order.update({
            where: { id: order.id },
            data: { remainingQty: takerRemaining.toString(), filledQty: takerFilledQty.toString(), status: "PARTIALLY_FILLED" },
        });
        bookOrder.remainingQty = takerRemaining;
        book.add(bookOrder);
        await enginePublisher.orderPartiallyFilled(order.id, order.userId, order.marketId, takerRemaining.toString());
        return;
    }

    // IOC/FOK: cancel remaining after partial fill
    // ponytail: FOK treated as IOC (partial fill allowed); strict FOK atomicity deferred
    const assetId = order.side === "BUY" ? order.market.quoteAssetId : order.market.baseAssetId;
    const releaseAmt = order.side === "BUY" ? price.mul(takerRemaining) : takerRemaining;

    await db.$transaction(async (tx) => {
        await tx.order.update({
            where: { id: order.id },
            data: {
                remainingQty: takerRemaining.toString(),
                filledQty: takerFilledQty.toString(),
                status: "CANCELLED",
                cancelledAt: new Date(),
            },
        });
        await tx.balance.update({
            where: { userId_assetId: { userId: order.userId, assetId } },
            data: { locked: { decrement: releaseAmt.toString() }, available: { increment: releaseAmt.toString() } },
        });
    });
}

async function reject(
    orderId: string,
    userId: string,
    marketId: string,
    side: string,
    quoteAssetId: string,
    baseAssetId: string,
    price: Decimal,
    remainingQty: Decimal,
) {
    const assetId = side === "BUY" ? quoteAssetId : baseAssetId;
    const releaseAmt = side === "BUY" ? price.mul(remainingQty) : remainingQty;

    await db.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { status: "REJECTED" } });
        await tx.balance.update({
            where: { userId_assetId: { userId, assetId } },
            data: { locked: { decrement: releaseAmt.toString() }, available: { increment: releaseAmt.toString() } },
        });
    });

    await enginePublisher.orderRejected(orderId, userId, marketId);
}
