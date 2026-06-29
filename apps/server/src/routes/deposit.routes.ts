import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { WalletController } from "../controllers/wallet.controller";
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

export async function depositRoutes(app: FastifyInstance) {
    const ctrl = new WalletController();

    app.post("/deposit", { preHandler: [authenticate], schema: { tags: ["Deposits"], summary: "Submit on-chain deposit tx", security: [{ bearerAuth: [] }], body: { type: "object", properties: { txHash: { type: "string" } }, required: ["txHash"] } } }, wrap(ctrl.submitDeposit.bind(ctrl), app));
    app.get("/deposit", { preHandler: [authenticate], schema: { tags: ["Deposits"], summary: "List user deposits", security: [{ bearerAuth: [] }] } }, wrap(ctrl.getDeposits.bind(ctrl), app));
    app.get("/deposit/:id", { preHandler: [authenticate], schema: { tags: ["Deposits"], summary: "Get deposit by ID", security: [{ bearerAuth: [] }] } }, wrap(ctrl.getDepositById.bind(ctrl), app));
}
