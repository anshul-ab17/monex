import type { FastifyRequest, FastifyReply } from "fastify";
import { marketService } from "../services/market/market.service";
import { ok } from "../utils/response";

export const marketController = {
    async list(_request: FastifyRequest, reply: FastifyReply) {
        const markets = await marketService.list();
        return reply.send(ok(markets));
    },

    async getById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const market = await marketService.getById(id);
        return reply.send(ok(market));
    },
};
