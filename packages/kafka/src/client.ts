import {Kafka} from "kafkajs";

export const kafka = new Kafka({
    clientId: "monex",
    brokers: process.env.KAFKA_BROKERS!.split(",")
})