import type { FastifyRequest, FastifyReply } from "fastify";
import db from "@repo/db";
import { CommonSchema } from "validation";
import { ok, fail } from "../utils/response";

export const tradeController = {
    async listByUser(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.sub;
        const q = CommonSchema.pagination.safeParse(request.query);
        if (!q.success) return reply.code(400).send(fail(q.error.message));
        const { page, limit } = q.data;
        const skip = (page - 1) * limit;

        const trades = await db.trade.findMany({
            where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
            include: { market: { select: { symbol: true } } },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        return reply.send(ok(trades));
    },

    async listByMarket(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        const { limit = 50 } = CommonSchema.pagination.parse(request.query);

        const trades = await db.trade.findMany({
            where: { marketId: params.data.id },
            select: {
                id: true,
                price: true,
                quantity: true,
                takerSide: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: Math.min(limit, 200),
        });

        return reply.send(ok(trades));
    },
};
