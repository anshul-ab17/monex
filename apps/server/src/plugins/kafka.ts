import fp from "fastify-plugin";
import { kafkaProducer, kafkaConsumer } from "@repo/kafka";
import type { FastifyInstance } from "fastify";

async function kafkaPlugin(app: FastifyInstance) {
    try {
        await kafkaProducer.connect();

        app.decorate("producer", kafkaProducer);
        app.decorate("consumer", kafkaConsumer);

        app.addHook("onClose", async () => {
            await kafkaProducer.disconnect();
            await kafkaConsumer.disconnect();
        });
        app.log.info("Kafka producer connected");
    } catch (err) {
        app.log.warn({ err }, "Kafka unavailable");
    }
}
export default fp(kafkaPlugin, {
    name: "kafka",
});