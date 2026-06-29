import Decimal from "decimal.js";
import db from "@repo/db";
import { kafkaConsumer, KafkaTopics } from "@repo/kafka";
import { OrderEventType } from "@repo/events";
import { findOrderById, setOrderStatus } from "../services/order/order.repository";
import { depthService } from "../services/market/depth.service";
import { redis } from "@repo/redis";
import { decodeEnvelope, decode } from "@repo/proto";
import { userEventsService } from "../services/user/user-events.service";

interface OrderEngineEvent {
    eventType: string;
    payload: { orderId: string; userId?: string; marketId?: string; remainingQty?: string; reason?: string };
    __raw?: Buffer;
}

async function parseEvent(event: OrderEngineEvent): Promise<OrderEngineEvent> {
    if (event.__raw) {
        const envelope = await decodeEnvelope(new Uint8Array(event.__raw));
        const inner = await decode<{ orderId: string; marketId: string; eventType: string; reason: string; remainingQty: string }>(
            "OrderEvent", new Uint8Array(envelope.payload),
        );
        return { eventType: envelope.eventType, payload: inner };
    }
    return event;
}

async function broadcastDepth(marketId: string) {
    try {
        await depthService.invalidate(marketId);
    } catch {
        // non-critical
    }
}

export async function startOrderConsumer() {
    await kafkaConsumer.subscribe<OrderEngineEvent>(
        "monex-order-consumer",
        KafkaTopics.ORDERS,
        async (rawEvent) => {
            const event = await parseEvent(rawEvent);
            const { orderId, marketId, remainingQty } = event.payload;

            if (event.eventType === OrderEventType.ACCEPTED) {
                await db.$transaction(async (tx) => {
                    await setOrderStatus(tx, orderId, "OPEN");
                    await tx.orderEvent.create({
                        data: { orderId, eventType: "PLACED" },
                    });
                });
                if (marketId) await broadcastDepth(marketId);
                const order = await findOrderById(orderId);
                if (order) await userEventsService.publishOrderUpdate(order.userId, { orderId, status: "OPEN", marketId: marketId ?? "" });
                return;
            }

            if (event.eventType === OrderEventType.REJECTED) {
                const order = await findOrderById(orderId);
                if (!order || !["PENDING", "OPEN"].includes(order.status)) return;

                const remaining = new Decimal(order.remainingQty.toString());
                const price = order.price ? new Decimal(order.price.toString()) : undefined;
                const assetId =
                    order.side === "BUY"
                        ? order.market.quoteAssetId
                        : order.market.baseAssetId;
                const releaseAmt = order.side === "BUY" ? price!.mul(remaining) : remaining;

                await db.$transaction(async (tx) => {
                    await setOrderStatus(tx, orderId, "REJECTED");
                    await tx.balance.update({
                        where: { userId_assetId: { userId: order.userId, assetId } },
                        data: {
                            locked: { decrement: releaseAmt.toString() },
                            available: { increment: releaseAmt.toString() },
                        },
                    });
                    await tx.orderEvent.create({
                        data: {
                            orderId,
                            eventType: "REJECTED",
                            remainingQty: order.remainingQty.toString(),
                        },
                    });
                });
                await broadcastDepth(order.marketId);
                return;
            }

            if (event.eventType === OrderEventType.PARTIALLY_FILLED) {
                const order = await findOrderById(orderId);
                if (!order) return;
                const filled = new Decimal(order.quantity.toString()).sub(
                    new Decimal(remainingQty ?? order.remainingQty.toString()),
                );
                await db.orderEvent.create({
                    data: {
                        orderId,
                        eventType: "PARTIALLY_FILLED",
                        filledQty: filled.toString(),
                        remainingQty: remainingQty ?? order.remainingQty.toString(),
                        price: order.price?.toString(),
                    },
                });
                await broadcastDepth(order.marketId);
                return;
            }

            if (event.eventType === OrderEventType.FILLED) {
                const order = await findOrderById(orderId);
                if (!order) return;
                await db.orderEvent.create({
                    data: {
                        orderId,
                        eventType: "FILLED",
                        filledQty: order.quantity.toString(),
                        remainingQty: "0",
                        price: order.price?.toString(),
                    },
                });
                await broadcastDepth(order.marketId);
                return;
            }

            if (event.eventType === OrderEventType.CANCELLED) {
                const order = await findOrderById(orderId);
                if (!order) return;
                await db.orderEvent.create({
                    data: {
                        orderId,
                        eventType: "CANCELLED",
                        remainingQty: order.remainingQty.toString(),
                    },
                });
                await broadcastDepth(order.marketId);
                return;
            }
        },
    );
}
