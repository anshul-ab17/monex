import type { BaseEvent } from "@repo/events";
import type { Producer } from "kafkajs";

import { kafka } from "./client";

export class KafkaProducer {
    private readonly producer: Producer;
    constructor() {
        this.producer = kafka.producer();
    }

    async connect(): Promise<void> {
        await this.producer.connect();
    }

    async disconnect(): Promise<void> {
        await this.producer.disconnect();
    }

    async publish<TPayload>(
        topic: string,
        event: BaseEvent<TPayload>,
    ): Promise<void> {
        await this.producer.send({
            topic,
            messages: [
                {
                    key: event.eventId,
                    value: JSON.stringify(event),
                },
            ],
        });
    }
}

export const kafkaProducer = new KafkaProducer();