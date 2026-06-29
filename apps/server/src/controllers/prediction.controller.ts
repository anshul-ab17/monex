import type { FastifyRequest, FastifyReply } from "fastify";
import { predictionService } from "../services/market/prediction.service";
import { ok } from "../utils/response";

export const predictionController = {
    async list(_req: FastifyRequest, reply: FastifyReply) {
        return reply.send(ok(await predictionService.list()));
    },

    async getById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        return reply.send(ok(await predictionService.getById(id)));
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
        const body = request.body as Parameters<typeof predictionService.create>[0];
        const markets = await predictionService.create(body);
        return reply.code(201).send(ok(markets));
    },

    async resolve(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const { winningOutcomeId } = request.body as { winningOutcomeId: string };
        return reply.send(ok(await predictionService.resolve(id, winningOutcomeId)));
    },
};
