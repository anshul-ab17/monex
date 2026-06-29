import type { FastifyInstance } from "fastify";
import { oracleController } from "../controllers/oracle.controller";

export async function oracleRoutes(app: FastifyInstance) {
    app.get("/oracle/prices", { schema: { tags: ["Oracle"], summary: "Get all oracle prices" } }, oracleController.getAllPrices);
    app.get("/oracle/pairs", { schema: { tags: ["Oracle"], summary: "List supported oracle pairs" } }, oracleController.getSupportedPairs);
    app.get("/oracle/markets/:id/price", { schema: { tags: ["Oracle"], summary: "Get mark price for market" } }, oracleController.getPrice);
}
