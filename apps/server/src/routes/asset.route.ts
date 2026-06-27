import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { assetController } from "../controllers/asset.controller";
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

export async function assetRoutes(app: FastifyInstance) {
    app.get("/assets", wrap(assetController.list, app));
    app.get("/assets/:id", wrap(assetController.getById, app));
}
