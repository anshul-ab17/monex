import fp from "fastify-plugin";

import { kafkaProducer, kafkaConsumer } from "@repo/kafka";

export default fp(async (app) => {
    await kafkaProducer.connect();

    app.decorate("producer", kafkaProducer);
    app.decorate("consumer", kafkaConsumer);
    app.addHook("onClose", async () => {
        await kafkaProducer.disconnect();
        await kafkaConsumer.disconnect();
    });
});