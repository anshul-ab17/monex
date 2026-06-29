import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { tradeController } from "../controllers/trade.controller";
import { AppError } from "../utils/errors";
import { fail } from "../utils/response";
import { authenticate } from "../middleware/auth.middleware";

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

export async function tradeRoutes(app: FastifyInstance) {
    app.get("/trades", { preHandler: [authenticate] }, wrap(tradeController.listByUser, app));
    app.get("/markets/:id/trades", wrap(tradeController.listByMarket, app));
}
