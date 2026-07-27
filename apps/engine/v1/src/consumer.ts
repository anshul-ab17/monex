import { kafkaConsumer, KafkaTopics } from "@repo/kafka";
import { OrderEventType } from "@repo/events";
import type { OrderCreatedEvent } from "@repo/events";
import { handleOrderCreated } from "./engine";

export async function startEngineConsumer() {
    await kafkaConsumer.subscribe<OrderCreatedEvent>(
        "reishi-engine-consumer",
        KafkaTopics.ORDERS,
        async (event) => {
            if (event.eventType !== OrderEventType.CREATED) return;
            await handleOrderCreated(event.payload);
        },
    );
}
