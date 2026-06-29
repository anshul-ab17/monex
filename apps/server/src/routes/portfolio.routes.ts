import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { portfolioController } from "../controllers/portfolio.controller";
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

export async function portfolioRoutes(app: FastifyInstance) {
    app.get("/portfolio", { preHandler: [authenticate], schema: { tags: ["Portfolio"], summary: "Get user portfolio", security: [{ bearerAuth: [] }] } }, wrap(portfolioController.getPortfolio, app));
    app.get("/portfolio/fee-tier", { preHandler: [authenticate], schema: { tags: ["Portfolio"], summary: "Get user fee tier", security: [{ bearerAuth: [] }] } }, wrap(portfolioController.getFeeTier, app));
    app.get("/fee-tiers", { schema: { tags: ["Portfolio"], summary: "List all fee tiers" } }, wrap(portfolioController.listFeeTiers, app));
}
