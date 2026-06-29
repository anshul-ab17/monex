import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { userController } from "../controllers/user.controller";
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

export async function userRoutes(app: FastifyInstance) {
    app.get("/user/me", { preHandler: [authenticate], schema: { tags: ["User"], summary: "Get current user profile", security: [{ bearerAuth: [] }] } }, wrap(userController.getMe, app));
    app.patch("/user/me", { preHandler: [authenticate], schema: { tags: ["User"], summary: "Update current user profile", security: [{ bearerAuth: [] }] } }, wrap(userController.updateMe, app));
}
