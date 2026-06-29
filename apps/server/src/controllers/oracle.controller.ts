import type { FastifyRequest, FastifyReply } from "fastify";
import { CommonSchema } from "@repo/validation";
import { oracleService } from "../services/oracle/oracle.service";
import { ok, fail } from "../utils/response";

export const oracleController = {
    async getPrice(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        const price = await oracleService.getMarkPrice(params.data.id);
        if (!price) return reply.code(404).send(fail("No price feed for this market"));
        return reply.send(ok({ price: price.toString() }));
    },

    async getAllPrices(_req: FastifyRequest, reply: FastifyReply) {
        const prices = await oracleService.getAllPrices();
        return reply.send(ok(prices));
    },

    async getSupportedPairs(_req: FastifyRequest, reply: FastifyReply) {
        return reply.send(ok(oracleService.getSupportedPairs()));
    },
};
