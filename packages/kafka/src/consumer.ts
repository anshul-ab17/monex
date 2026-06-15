import { kafka } from "./client";

export class KafkaConsumer {
    async subscribe(
        groupId: string,
        topic : string,
        handler:(
            message: unknown,
        ) => Promise<void>,
    ) {
        const consumer =kafka.consumer({groupId});

        await consumer.connect();
        await consumer.subscribe({
            topic,
            fromBeginning:false,
        });

        await consumer.run({
            eachMessage: async ({
                message,
            }) => {
                if (!message.value){
                    return;
                }

                const payload = JSON.parse(message.value.toString());

                await handler(payload);
            }
        });

        return consumer;
    }
}