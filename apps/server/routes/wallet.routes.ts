import type {FastifyInstance } from "fastify";

export async function walletRoutes(
  app: FastifyInstance
) {
  app.get("/wallet", async () => {
    return {
      message: "Get wallets",
    };
  });

  app.post("/wallet", async () => {
    return {
      message: "Add wallet",
    };
  });

  app.delete("/wallet/:id", async () => {
    return {
      message: "Delete wallet",
    };
  });
}