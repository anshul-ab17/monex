import type { FastifyRequest, FastifyReply } from "fastify";
import { PredictionSchema, CommonSchema } from "@repo/validation";
import { predictionService } from "../services/market/prediction.service";
import { ok, fail } from "../utils/response";

export const predictionController = {
    async list(_req: FastifyRequest, reply: FastifyReply) {
        return reply.send(ok(await predictionService.list()));
    },

    async getById(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        return reply.send(ok(await predictionService.getById(params.data.id)));
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
        const parsed = PredictionSchema.create.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));
        const markets = await predictionService.create(parsed.data);
        return reply.code(201).send(ok(markets));
    },

    async resolve(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        const body = PredictionSchema.resolve.safeParse(request.body);
        if (!body.success) return reply.code(400).send(fail(body.error.message));
        return reply.send(ok(await predictionService.resolve(params.data.id, body.data.winningOutcomeId)));
    },
};
