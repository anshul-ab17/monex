import type { FastifyInstance } from "fastify";
import { marginController } from "../controllers/margin.controller";
import { authenticate } from "../middleware/auth.middleware";

export async function marginRoutes(app: FastifyInstance) {
    app.get("/margin/:id", { preHandler: [authenticate], schema: { tags: ["Margin"], summary: "Get margin account", security: [{ bearerAuth: [] }] } }, marginController.getMarginAccount);
    app.post("/margin/:id/add", { preHandler: [authenticate], schema: { tags: ["Margin"], summary: "Add margin to position", security: [{ bearerAuth: [] }], body: { type: "object", properties: { amount: { type: "number" } }, required: ["amount"] } } }, marginController.addMargin);
}
