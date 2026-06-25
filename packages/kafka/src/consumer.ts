import type { Consumer, EachMessagePayload } from "kafkajs";
import { kafka } from "./client";

export class KafkaConsumer {
    private readonly consumers: Consumer[] = [];
    async subscribe<T>(
        groupId: string,
        topic: string,
        handler: (message:T, rawMessage: EachMessagePayload) => Promise<void>,
    ): Promise<Consumer> {
        const consumer = kafka.consumer({
            groupId,
        });

        this.consumers.push(consumer);
        await consumer.connect();
        await consumer.subscribe({
            topic,
            fromBeginning: false,
        });

        await consumer.run({
            eachMessage: async (
                payload: EachMessagePayload,
            ) => {
                const { message } = payload;

                if (!message.value) {
                    return;
                }

                try {
                    const parsedMessage = JSON.parse(
                        message.value.toString(),
                    ) as T;

                    await handler(
                        parsedMessage,
                        payload,
                    );
                } catch (error) {
                    console.error(
                        `Failed to process message from topic ${topic}`,
                        error,
                    );
                }
            },
        });

        return consumer;
    }

    async disconnect(): Promise<void> {
        await Promise.all(
            this.consumers.map((consumer) =>
                consumer.disconnect(),
            ),
        );
    }
}

export const kafkaConsumer = new KafkaConsumer();