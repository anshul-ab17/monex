import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuthController } from "../controllers/auth.controller";
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

export async function authRoutes(app: FastifyInstance) {
    const ctrl = new AuthController(app);

    app.get("/auth/nonce", wrap(ctrl.getNonce.bind(ctrl), app));
    app.post("/auth/wallet", wrap(ctrl.walletLogin.bind(ctrl), app));
    app.post("/auth/refresh", wrap(ctrl.refresh.bind(ctrl), app));
    app.post("/auth/logout", wrap(ctrl.logout.bind(ctrl), app));
}
