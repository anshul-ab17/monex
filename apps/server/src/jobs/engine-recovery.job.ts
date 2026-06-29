import db from "@repo/db";
import { kafkaProducer, KafkaTopics } from "@repo/kafka";
import { OrderEventType } from "@repo/events";

// On startup: replay all OPEN and PARTIALLY_FILLED orders into the engine's Kafka topic.
// The engine will re-add them to its in-memory order book.
export async function loadPendingOrders() {
    const orders = await db.order.findMany({
        where: {
            status: { in: ["OPEN", "PARTIALLY_FILLED"] },
            type: { in: ["LIMIT", "MARKET"] },
        },
        include: { market: true },
        orderBy: { createdAt: "asc" },
    });

    if (orders.length === 0) {
        console.info("[engine-recovery] No pending orders to replay");
        return;
    }

    console.info(`[engine-recovery] Replaying ${orders.length} orders to engine`);

    for (const order of orders) {
        await kafkaProducer.publish(KafkaTopics.ENGINE, {
            eventType: OrderEventType.CREATED,
            payload: {
                orderId: order.id,
                userId: order.userId,
                marketId: order.marketId,
                side: order.side,
                type: order.type,
                price: order.price?.toString(),
                quantity: order.remainingQty.toString(), // replay remaining qty
                timeInForce: "GTC",
                postOnly: false,
                sequenceNumber: Number(order.sequenceNumber),
            },
        });
    }

    console.info(`[engine-recovery] Replayed ${orders.length} orders`);
}
