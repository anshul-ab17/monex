import fastify from "fastify";
import cors from "@fastify/cors";
import routes from "./src/routes";
import test from "./src/test";
import { env } from "@repo/config";
import redisPlugin from "./src/plugins/redis";
import prismaPlugin from "./src/plugins/prisma";
import KafkaPlugin from "./src/plugins/kafka";
import jwtPlugin from "./src/plugins/jwt";
import { startConsumers } from "./src/consumers";
import { startCleanupJob } from "./src/jobs/cleanup.job";
import { startDepositPoller } from "./src/jobs/deposit-poller.job";


export async function createHttpServer() {
    const app = fastify({
        logger: true,
    });

    await app.register(cors, {
        origin: env.FRONTEND_URL,
        credentials: true,
    });

    await app.register(redisPlugin);
    await app.register(prismaPlugin);
    await app.register(KafkaPlugin);
    await app.register(jwtPlugin);

    app.get("/health", async () => ({
        status: "ok",
    }));

    await app.register(routes, {
        prefix: "/api/v1",
    });

    await app.register(test, {
        prefix:"temp/test/"
    });

    app.addHook("onReady", async () => {
        await startConsumers();
        startCleanupJob();
        startDepositPoller();
    });

    return app;
}
