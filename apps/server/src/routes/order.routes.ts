import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { OrderController } from "../controllers/order.controller";
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

export async function orderRoutes(app: FastifyInstance) {
    const ctrl = new OrderController();

    app.post("/orders", { preHandler: [authenticate], schema: { tags: ["Orders"], summary: "Place a new order", security: [{ bearerAuth: [] }], body: { type: "object", properties: { marketId: { type: "string", format: "uuid" }, asset: { type: "string" }, side: { type: "string", enum: ["BUY", "SELL"] }, type: { type: "string", enum: ["LIMIT", "MARKET", "STOP_LIMIT", "STOP_MARKET"] }, quantity: { type: "number" }, price: { type: "number" }, stopPrice: { type: "number" }, timeInForce: { type: "string", enum: ["GTC", "IOC", "FOK"] }, postOnly: { type: "boolean" }, reduceOnly: { type: "boolean" } }, required: ["marketId", "asset", "side", "type", "quantity"] } } }, wrap(ctrl.create.bind(ctrl), app));
    app.get("/orders", { preHandler: [authenticate], schema: { tags: ["Orders"], summary: "List user orders", security: [{ bearerAuth: [] }] } }, wrap(ctrl.list.bind(ctrl), app));
    app.get("/orders/:id", { preHandler: [authenticate], schema: { tags: ["Orders"], summary: "Get order by ID", security: [{ bearerAuth: [] }] } }, wrap(ctrl.getById.bind(ctrl), app));
    app.delete("/orders/:id", { preHandler: [authenticate], schema: { tags: ["Orders"], summary: "Cancel an order", security: [{ bearerAuth: [] }] } }, wrap(ctrl.cancel.bind(ctrl), app));
}
