import type { FastifyRequest, FastifyReply } from "fastify";
import { marketService } from "../services/market/market.service";
import { candleService } from "../services/market/candle.service";
import { depthService } from "../services/market/depth.service";
import { tickerService } from "../services/market/ticker.service";
import { ok, fail } from "../utils/response";
import type { CandleInterval } from "@repo/db";

const VALID_INTERVALS = new Set<string>(["M1", "M5", "M15", "M30", "H1", "H4", "D1"]);

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

    async getDepth(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const { levels = "20" } = request.query as { levels?: string };
        const depth = await depthService.getDepth(id, parseInt(levels));
        return reply.send(ok(depth));
    },

    async getCandles(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const { interval = "M1", limit = "100" } = request.query as { interval?: string; limit?: string };
        if (!VALID_INTERVALS.has(interval)) {
            return reply.code(400).send(fail("Invalid interval"));
        }
        const candles = await candleService.getCandles(id, interval as CandleInterval, parseInt(limit));
        return reply.send(ok(candles));
    },

    async getTicker(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const ticker = await tickerService.getTicker(id);
        if (!ticker) return reply.code(404).send(fail("No trades yet"));
        return reply.send(ok(ticker));
    },
};
