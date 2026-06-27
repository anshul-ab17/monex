import { randomUUID } from "crypto";
import { kafkaProducer, KafkaTopics } from "@repo/kafka";
import { OrderEventType } from "@repo/events";
import type { OrderCreatedPayload } from "@repo/events";
import { env } from "@repo/config";

export const orderPublisher = {
    async orderCreated(payload: OrderCreatedPayload) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.ORDERS, {
            eventId: randomUUID(),
            eventType: OrderEventType.CREATED,
            timestamp: new Date().toISOString(),
            version: 1,
            payload,
        });
    },

    async orderCancelled(payload: { orderId: string; userId: string; marketId: string }) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.ORDERS, {
            eventId: randomUUID(),
            eventType: OrderEventType.CANCELLED,
            timestamp: new Date().toISOString(),
            version: 1,
            payload,
        });
    },
};
