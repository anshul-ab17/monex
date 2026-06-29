import type { FastifyInstance } from "fastify";
import { marginController } from "../controllers/margin.controller";
import { authenticate } from "../middleware/auth.middleware";

export async function marginRoutes(app: FastifyInstance) {
    app.get("/margin/:id", { preHandler: [authenticate] }, marginController.getMarginAccount);
    app.post("/margin/:id/add", { preHandler: [authenticate] }, marginController.addMargin);
}
