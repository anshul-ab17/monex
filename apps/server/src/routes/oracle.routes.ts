import type { FastifyInstance } from "fastify";
import { oracleController } from "../controllers/oracle.controller";

export async function oracleRoutes(app: FastifyInstance) {
    app.get("/oracle/prices", oracleController.getAllPrices);
    app.get("/oracle/pairs", oracleController.getSupportedPairs);
    app.get("/oracle/markets/:id/price", oracleController.getPrice);
}
