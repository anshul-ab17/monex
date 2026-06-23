import fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@repo/config";
import redisPlugin from "./src/plugins/redis";
import routes from "./src/routes";
import prismaPlugin from "./src/plugins/prisma";


export async function createHttpServer() {
    const app = fastify({
        logger: true,
    });

    await app.register(cors, {
        origin: env.FRONTEND_URL,
        credentials: true,
    });

    //temp test
    app.get("/db-test", async(request)=> {
        const users = await request.server.prisma.user.findMany();
        return users;
    })


    await app.register(redisPlugin);
    await app.register(prismaPlugin);

    app.get("/health", async () => ({
        status: "ok",
    }));

    await app.register(routes, {
        prefix: "/api/v1",
    });

    return app;
}