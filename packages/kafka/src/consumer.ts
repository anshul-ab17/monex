import { kafka } from "./client";
import type {
  Consumer,
  EachMessagePayload,
} from "kafkajs";

export class KafkaConsumer {
  async subscribe<T>(
    groupId: string,
    topic: string,
    handler: (
      message: T,
      rawMessage: EachMessagePayload,
    ) => Promise<void>,
  ): Promise<Consumer> {
    const consumer = kafka.consumer({
      groupId,
    });

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
          const parsedMessage =
            JSON.parse(
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
}

export const kafkaConsumer =
  new KafkaConsumer();