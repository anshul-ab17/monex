import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { predictionController } from "../controllers/prediction.controller";
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

export async function predictionRoutes(app: FastifyInstance) {
    // Public
    app.get("/predict/markets", wrap(predictionController.list, app));
    app.get("/predict/markets/:id", wrap(predictionController.getById, app));

    // Admin (auth required — in production, add admin role check)
    app.post("/predict/markets", { preHandler: [authenticate] }, wrap(predictionController.create, app));
    app.post("/predict/markets/:id/resolve", { preHandler: [authenticate] }, wrap(predictionController.resolve, app));
}
