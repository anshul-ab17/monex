import type { FastifyInstance } from "fastify";

export async function tests(app: FastifyInstance) {
    app.get("/jwt-test", async (_request, reply) => {
        const token = await reply.jwtSign({
            sub: "123",
            walletAddress: "wallet_abc",
        });

        return { token };
    });

    app.get("/db-test", async (request) => {
        return request.server.prisma.user.findMany();
    });
}