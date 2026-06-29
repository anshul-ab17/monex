import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { marketController } from "../controllers/market.controller";
import { fundingService } from "../services/market/funding.service";
import { AppError } from "../utils/errors";
import { ok, fail } from "../utils/response";

function wrap(fn: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>, app: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            return await fn(request, reply);
        } catch (err) {
            if (err instanceof AppError) {
                return reply.code(err.statusCode).send(fail(err.message, err.code));
            }
            app.log.error(err);
            return reply.code(500).send(fail("Internal server error", "INTERNAL"));
        }
    };
}

export async function marketRoutes(app: FastifyInstance) {
    app.get("/markets", { schema: { tags: ["Markets"], summary: "List all markets" } }, wrap(marketController.list, app));
    app.get("/markets/:id", { schema: { tags: ["Markets"], summary: "Get market by ID" } }, wrap(marketController.getById, app));
    app.get("/markets/:id/candles", { schema: { tags: ["Markets"], summary: "Get OHLCV candles" } }, wrap(marketController.getCandles, app));
    app.get("/markets/:id/depth", { schema: { tags: ["Markets"], summary: "Get order book depth" } }, wrap(marketController.getDepth, app));
    app.get("/markets/:id/ticker", { schema: { tags: ["Markets"], summary: "Get 24h ticker" } }, wrap(marketController.getTicker, app));
    app.get("/markets/:id/funding", { schema: { tags: ["Markets"], summary: "Get current funding rate" } }, wrap(async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        return reply.send(ok(await fundingService.getFundingRate(id)));
    }, app));
}
