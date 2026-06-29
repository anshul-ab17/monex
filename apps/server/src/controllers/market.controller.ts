import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { CommonSchema } from "validation";
import { marketService } from "../services/market/market.service";
import { candleService } from "../services/market/candle.service";
import { depthService } from "../services/market/depth.service";
import { tickerService } from "../services/market/ticker.service";
import { ok, fail } from "../utils/response";
import type { CandleInterval } from "@repo/db";

const VALID_INTERVALS = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"] as const;

const candleQuery = z.object({
    interval: z.enum(VALID_INTERVALS).default("M1"),
    limit: z.coerce.number().positive().max(500).default(100),
});

const depthQuery = z.object({
    levels: z.coerce.number().positive().max(100).default(20),
});

export const marketController = {
    async list(_request: FastifyRequest, reply: FastifyReply) {
        const markets = await marketService.list();
        return reply.send(ok(markets));
    },

    async getById(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        const market = await marketService.getById(params.data.id);
        return reply.send(ok(market));
    },

    async getDepth(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        const q = depthQuery.safeParse(request.query);
        if (!q.success) return reply.code(400).send(fail(q.error.message));
        const depth = await depthService.getDepth(params.data.id, q.data.levels);
        return reply.send(ok(depth));
    },

    async getCandles(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        const q = candleQuery.safeParse(request.query);
        if (!q.success) return reply.code(400).send(fail(q.error.message));
        const candles = await candleService.getCandles(params.data.id, q.data.interval as CandleInterval, q.data.limit);
        return reply.send(ok(candles));
    },

    async getTicker(request: FastifyRequest, reply: FastifyReply) {
        const params = CommonSchema.idParam.safeParse(request.params);
        if (!params.success) return reply.code(400).send(fail(params.error.message));
        const ticker = await tickerService.getTicker(params.data.id);
        if (!ticker) return reply.code(404).send(fail("No trades yet"));
        return reply.send(ok(ticker));
    },
};
