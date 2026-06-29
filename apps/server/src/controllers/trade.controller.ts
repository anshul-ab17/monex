import type { FastifyRequest, FastifyReply } from "fastify";
import db from "@repo/db";
import { ok } from "../utils/response";

export const tradeController = {
    // GET /trades — user's trade history
    async listByUser(request: FastifyRequest, reply: FastifyReply) {
        const userId = (request.user as { userId: string }).userId;
        const { page = "1", limit = "50" } = request.query as { page?: string; limit?: string };
        const skip = (Number(page) - 1) * Number(limit);

        const trades = await db.trade.findMany({
            where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
            include: { market: { select: { symbol: true } } },
            orderBy: { createdAt: "desc" },
            skip,
            take: Math.min(Number(limit), 100),
        });

        return reply.send(ok(trades));
    },

    // GET /markets/:id/trades — public trade tape
    async listByMarket(request: FastifyRequest, reply: FastifyReply) {
        const { id: marketId } = request.params as { id: string };
        const { limit = "50" } = request.query as { limit?: string };

        const trades = await db.trade.findMany({
            where: { marketId },
            select: {
                id: true,
                price: true,
                quantity: true,
                takerSide: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: Math.min(Number(limit), 200),
        });

        return reply.send(ok(trades));
    },
};
