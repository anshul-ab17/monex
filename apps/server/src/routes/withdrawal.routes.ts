import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { WithdrawalController } from "../controllers/withdrawal.controller";
import { AppError } from "../utils/errors";
import { fail } from "../utils/response";
import { authenticate } from "../middleware/auth.middleware";

function wrap(fn: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>, app: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            return await fn(request, reply);
        } catch (err) {
            if (err instanceof AppError) return reply.code(err.statusCode).send(fail(err.message, err.code));
            app.log.error(err);
            return reply.code(500).send(fail("Internal server error", "INTERNAL"));
        }
    };
}

export async function withdrawalRoutes(app: FastifyInstance) {
    const ctrl = new WithdrawalController();

    app.post("/withdrawal", { preHandler: [authenticate], schema: { tags: ["Withdrawals"], summary: "Request withdrawal", security: [{ bearerAuth: [] }], body: { type: "object", properties: { assetId: { type: "string", format: "uuid" }, amount: { type: "number" }, destinationAddress: { type: "string" }, signature: { type: "string" } }, required: ["assetId", "amount", "destinationAddress", "signature"] } } }, wrap(ctrl.requestWithdrawal.bind(ctrl), app));
    app.get("/withdrawal", { preHandler: [authenticate], schema: { tags: ["Withdrawals"], summary: "List user withdrawals", security: [{ bearerAuth: [] }] } }, wrap(ctrl.getWithdrawals.bind(ctrl), app));
    app.get("/withdrawal/:id", { preHandler: [authenticate], schema: { tags: ["Withdrawals"], summary: "Get withdrawal by ID", security: [{ bearerAuth: [] }] } }, wrap(ctrl.getWithdrawalById.bind(ctrl), app));
}
