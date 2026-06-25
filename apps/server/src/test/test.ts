import type { FastifyInstance } from "fastify";

export async function tests(app: FastifyInstance) {
    app.get("/jwt-test", async (_request, reply) => {
        const token = await reply.jwtSign({
            userId: "123",
            walletAddress: "wallet_abc",
            sessionId:"sesssion223x"
        });

        return { token };
    });

    app.get("/db-test", async (request) => {
        return request.server.prisma.user.findMany();
    });
}