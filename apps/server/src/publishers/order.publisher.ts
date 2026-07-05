import { kafkaProducer, KafkaTopics } from "@repo/kafka";
import { OrderEventType } from "@repo/events";
import type { OrderCreatedPayload } from "@repo/events";
import { env } from "@repo/config";
import { makeEvent } from "./make-event";

export const orderPublisher = {
    async orderCreated(payload: OrderCreatedPayload) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.ORDERS, makeEvent(OrderEventType.CREATED, payload));
    },

    async orderCancelled(payload: { orderId: string; userId: string; marketId: string }) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.ORDERS, makeEvent(OrderEventType.CANCELLED, payload));
    },
};
