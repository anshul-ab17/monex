import Decimal from "decimal.js";
import db from "@repo/db";
import { kafkaConsumer, KafkaTopics } from "@repo/kafka";
import { OrderEventType } from "@repo/events";
import { findOrderById, setOrderStatus } from "../services/order/order.repository";

interface OrderEngineEvent {
    eventType: string;
    payload: { orderId: string };
}

export async function startOrderConsumer() {
    await kafkaConsumer.subscribe<OrderEngineEvent>(
        "monex-order-consumer",
        KafkaTopics.ORDERS,
        async (event) => {
            const { orderId } = event.payload;

            if (event.eventType === OrderEventType.ACCEPTED) {
                await db.$transaction(async (tx) => {
                    await setOrderStatus(tx, orderId, "OPEN");
                });
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
                });
            }
        },
    );
}
