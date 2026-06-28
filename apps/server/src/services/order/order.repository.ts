import db from "@repo/db";
import type { OrderSide, OrderStatus, OrderType, TimeInForce } from "@repo/db";

type Tx = Parameters<Parameters<(typeof db)["$transaction"]>[0]>[0];

export async function insertOrder(
    tx: Tx,
    data: {
        userId: string;
        marketId: string;
        clientOrderId?: string;
        side: OrderSide;
        type: OrderType;
        status: OrderStatus;
        sequenceNumber: bigint;
        price?: string | null;
        stopPrice?: string | null;
        quantity: string;
        remainingQty: string;
        timeInForce: TimeInForce;
        postOnly: boolean;
        reduceOnly: boolean;
    },
) {
    return tx.order.create({ data });
}

export async function findOrderById(id: string, userId?: string) {
    return db.order.findFirst({
        where: { id, ...(userId ? { userId } : {}) },
        include: { market: { include: { baseAsset: true, quoteAsset: true } } },
    });
}

export async function findOrdersByUser(userId: string, page: number, limit: number) {
    const [orders, total] = await Promise.all([
        db.order.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: { market: { select: { symbol: true } } },
        }),
        db.order.count({ where: { userId } }),
    ]);
    return { orders, total };
}

export async function setOrderStatus(
    tx: Tx,
    orderId: string,
    status: OrderStatus,
    extra: { cancelledAt?: Date } = {},
) {
    return tx.order.update({ where: { id: orderId }, data: { status, ...extra } });
}
