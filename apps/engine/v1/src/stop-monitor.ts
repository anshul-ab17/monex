import Decimal from "decimal.js";
import db from "@repo/db";
import { kafkaProducer, KafkaTopics } from "@repo/kafka";
import { OrderEventType } from "@repo/events";

interface StopOrder {
    orderId: string;
    userId: string;
    marketId: string;
    side: "BUY" | "SELL";
    type: "STOP_LIMIT" | "STOP_MARKET";
    stopPrice: Decimal;
    price: Decimal | null;
    quantity: Decimal;
}

const stopOrders = new Map<string, StopOrder[]>();

export const stopMonitor = {
    async loadPending() {
        const orders = await db.order.findMany({
            where: { type: { in: ["STOP_LIMIT", "STOP_MARKET"] }, status: "OPEN" },
        });
        for (const o of orders) {
            add({
                orderId: o.id,
                userId: o.userId,
                marketId: o.marketId,
                side: o.side as "BUY" | "SELL",
                type: o.type as "STOP_LIMIT" | "STOP_MARKET",
                stopPrice: new Decimal(o.stopPrice!.toString()),
                price: o.price ? new Decimal(o.price.toString()) : null,
                quantity: new Decimal(o.remainingQty.toString()),
            });
        }
    },

    add,

    async checkPrice(marketId: string, lastPrice: Decimal) {
        const orders = stopOrders.get(marketId);
        if (!orders?.length) return;

        const triggered: StopOrder[] = [];
        const remaining: StopOrder[] = [];

        for (const o of orders) {
            const hit = o.side === "BUY"
                ? lastPrice.gte(o.stopPrice)
                : lastPrice.lte(o.stopPrice);
            if (hit) triggered.push(o);
            else remaining.push(o);
        }

        if (!triggered.length) return;
        stopOrders.set(marketId, remaining);

        for (const o of triggered) {
            if (o.type === "STOP_LIMIT") {
                await db.order.update({
                    where: { id: o.orderId },
                    data: { type: "LIMIT", status: "PENDING" },
                });
            } else {
                await db.order.update({
                    where: { id: o.orderId },
                    data: { type: "MARKET", status: "PENDING" },
                });
            }

            await kafkaProducer.publish(KafkaTopics.ENGINE, {
                eventType: OrderEventType.CREATED,
                payload: { orderId: o.orderId, userId: o.userId, marketId: o.marketId },
            });
        }
    },
};

function add(order: StopOrder) {
    const list = stopOrders.get(order.marketId) ?? [];
    list.push(order);
    stopOrders.set(order.marketId, list);
}
