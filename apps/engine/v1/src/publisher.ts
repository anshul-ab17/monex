import { kafkaProducer, KafkaTopics } from "@repo/kafka";
import { OrderEventType, TradeEventType } from "@repo/events";
import type { TradeExecutedPayload } from "@repo/events";

function makeEvent<T>(eventType: string, payload: T) {
    return {
        eventId: crypto.randomUUID(),
        eventType,
        timestamp: new Date().toISOString(),
        version: 1,
        payload,
    };
}

export const enginePublisher = {
    async orderAccepted(orderId: string, userId: string, marketId: string) {
        await kafkaProducer.publish(
            KafkaTopics.ORDERS,
            makeEvent(OrderEventType.ACCEPTED, { orderId, userId, marketId }),
        );
    },

    async orderRejected(orderId: string, userId: string, marketId: string) {
        await kafkaProducer.publish(
            KafkaTopics.ORDERS,
            makeEvent(OrderEventType.REJECTED, { orderId, userId, marketId }),
        );
    },

    async orderFilled(orderId: string, userId: string, marketId: string) {
        await kafkaProducer.publish(
            KafkaTopics.ORDERS,
            makeEvent(OrderEventType.FILLED, { orderId, userId, marketId }),
        );
    },

    async orderPartiallyFilled(orderId: string, userId: string, marketId: string, remainingQty: string) {
        await kafkaProducer.publish(
            KafkaTopics.ORDERS,
            makeEvent(OrderEventType.PARTIALLY_FILLED, { orderId, userId, marketId, remainingQty }),
        );
    },

    async tradeExecuted(payload: TradeExecutedPayload) {
        await kafkaProducer.publish(KafkaTopics.TRADES, makeEvent(TradeEventType.EXECUTED, payload));
    },
};
