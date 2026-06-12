import { kafka } from "./client";
import type { Producer } from "kafkajs";


class KafkaProducer {
    private producer: Producer;

    constructor(){
        this.producer = kafka.producer();
    }

    async connect(){
        await this.producer.connect();
    }

    async disconnect(){
        await this.producer.disconnect();
    }

    async publish(topic:string, event:unknown){
        await this.producer.send({
            topic,
            messages:[
                {
                 value:JSON.stringify(event),
                },
            ],
        });
    }
}

export const kafkaProducer = new KafkaProducer();