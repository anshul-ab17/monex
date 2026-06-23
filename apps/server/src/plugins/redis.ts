import fp from "fastify-plugin";
import { redis } from "@repo/redis";

export default fp(async (app) => {
    app.decorate("redis", redis);
    app.addHook("onClose", async () => {
        await redis.quit();
    });
});