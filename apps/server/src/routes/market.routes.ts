import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { marketController } from "../controllers/market.controller";
import { AppError } from "../utils/errors";
import { fail } from "../utils/response";

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
    app.get("/markets", wrap(marketController.list, app));
    app.get("/markets/:id", wrap(marketController.getById, app));
    app.get("/markets/:id/candles", wrap(marketController.getCandles, app));
    app.get("/markets/:id/depth", wrap(marketController.getDepth, app));
    app.get("/markets/:id/ticker", wrap(marketController.getTicker, app));
}
