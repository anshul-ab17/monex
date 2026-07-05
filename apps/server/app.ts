import fastify from "fastify";
import cors from "@fastify/cors";
import wsPlugin from "@fastify/websocket";
import rateLimit from "@fastify/rate-limit";
import routes from "./src/routes";
import { env } from "@repo/config";
import redisPlugin from "./src/plugins/redis";
import prismaPlugin from "./src/plugins/prisma";
import KafkaPlugin from "./src/plugins/kafka";
import jwtPlugin from "./src/plugins/jwt";
import { startConsumers } from "./src/consumers";
import { startCleanupJob } from "./src/jobs/cleanup.job";
import { startDepositPoller } from "./src/jobs/deposit-poller.job";
import { loadPendingOrders } from "./src/jobs/engine-recovery.job";
import { startPredictionExpiryJob } from "./src/jobs/prediction-expiry.job";
import { startFundingJob } from "./src/jobs/funding.job";
import { startLiquidationJob } from "./src/jobs/liquidation.job";
import { startPredictionOracleJob } from "./src/jobs/prediction-oracle.job";
import { wsRoutes } from "./src/ws/ws.routes";
import { register, httpRequestDuration } from "./src/utils/metrics";
import auditPlugin from "./src/plugins/audit";
import swaggerPlugin from "./src/plugins/swagger";
import { registerCorrelationId } from "./src/utils/logger";


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
    await app.register(auditPlugin);
    await app.register(swaggerPlugin);
    await app.register(wsPlugin);

    registerCorrelationId(app);

    await app.register(rateLimit, {
        max: 100,
        timeWindow: "1 minute",
        skipOnError: true,
    });

    // Request duration tracking
    app.addHook("onResponse", (request, reply, done) => {
        httpRequestDuration
            .labels(request.method, request.routeOptions?.url ?? request.url, String(reply.statusCode))
            .observe(reply.elapsedTime);
        done();
    });

    app.get("/metrics", async (_req, reply) => {
        reply.header("Content-Type", register.contentType);
        return reply.send(await register.metrics());
    });

    app.get("/health", async (_req, reply) => {
        const checks: Record<string, string> = {};
        let overallOk = true;

        // PostgreSQL
        try {
            await app.prisma.$queryRaw`SELECT 1`;
            checks.postgres = "ok";
        } catch {
            checks.postgres = "error";
            overallOk = false;
        }

        // Redis
        try {
            await app.redis.ping();
            checks.redis = "ok";
        } catch {
            checks.redis = "error";
            overallOk = false;
        }

        // Kafka (check producer connected via plugin flag)
        checks.kafka = (app as unknown as { kafkaReady?: boolean }).kafkaReady ? "ok" : "degraded";

        const status = overallOk ? 200 : 503;
        return reply.code(status).send({ status: overallOk ? "ok" : "degraded", checks });
    });

    await app.register(routes, {
        prefix: "/api/v1",
    });

    await app.register(wsRoutes, { prefix: "/api/v1" });

    app.addHook("onReady", async () => {
        await startConsumers();
        startCleanupJob();
        startDepositPoller();
        startPredictionExpiryJob();
        startFundingJob();
        startLiquidationJob();
        startPredictionOracleJob();
        if (env.USE_KAFKA) {
            // Small delay to allow engine to subscribe before replaying
            setTimeout(() => loadPendingOrders().catch(app.log.error), 5000);
        }
    });

    return app;
}
