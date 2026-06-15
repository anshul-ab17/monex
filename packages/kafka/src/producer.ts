import { kafka } from "./client";
import type { Producer } from "kafkajs";
import type { BaseEvent } from "@repo/events";

class KafkaProducer {
  private producer: Producer;

  constructor() {
    this.producer = kafka.producer();
  }

  async connect() {
    await this.producer.connect();
  }

  async disconnect() {
    await this.producer.disconnect();
  }

  async publish<TPayload>(
    topic: string,
    event: BaseEvent<TPayload>,
  ) {
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