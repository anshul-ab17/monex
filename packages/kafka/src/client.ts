import { Kafka } from "kafkajs";
import { env } from "@repo/config";

export const kafka = new Kafka({
    clientId: "monex",
    brokers: [env.KAFKA_BROKER],
});