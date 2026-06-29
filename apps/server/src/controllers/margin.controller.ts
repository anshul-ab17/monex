import type { FastifyRequest, FastifyReply } from "fastify";
import Decimal from "decimal.js";
import { CommonSchema } from "validation";
import { marginService } from "../services/margin/margin.service";
import { ok, fail } from "../utils/response";
import { z } from "zod";

const addMarginSchema = z.object({
    amount: z.string().refine((v) => new Decimal(v).gt(0), "Amount must be positive"),
});

export const marginController = {
    async getMarginAccount(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        const account = await marginService.getMarginAccount(request.user.sub, params.data.id);
        if (!account) return reply.code(404).send(fail("No margin account for this market"));
        return reply.send(ok(account));
    },

    async addMargin(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        const body = addMarginSchema.safeParse(request.body);
        if (!body.success) return reply.code(400).send(fail(body.error.message));

        await marginService.addMargin(request.user.sub, params.data.id, new Decimal(body.data.amount));
        return reply.send(ok({ added: body.data.amount }));
    },
};
