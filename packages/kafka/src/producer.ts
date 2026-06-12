import { kafka } from "./client";
import { Producer } from "kafkajs";


class KafkaProducer {
    private producer: Producer;

    constructor(){
        this.producer = kafka.producer();
    }

    async connect(){
        await this.producer.connect();
    }


}