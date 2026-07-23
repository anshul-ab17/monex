import { Kafka } from "kafkajs";
import { env } from "@repo/config";

export const kafka = new Kafka({
    clientId: "reishi",
    brokers: [env.KAFKA_BROKER],
    requestTimeout: 30000,
});