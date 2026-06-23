import fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@repo/config";
import routes from "./routes";

export async function createHttpServer() {
    const app = fastify({
        logger: true,
    });

    await app.register(cors, {
        origin: env.FRONTEND_URL,
        credentials: true,
    });

    app.get("/health", async () => ({
        status: "ok",
    }));

    await app.register(routes, {
        prefix: "/api/v1",
    });

    return app;
}