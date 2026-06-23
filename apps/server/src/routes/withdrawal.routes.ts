import type {FastifyInstance } from "fastify";

export async function withdrawalRoutes(
  app: FastifyInstance
) {
  app.post("/withdrawal", async () => {
    return {
      message: "Create withdrawal",
    };
  });

  app.get("/withdrawal", async () => {
    return {
      message: "Withdrawal history",
    };
  });

  app.get("/withdrawal/:id", async () => {
    return {
      message: "Withdrawal details",
    };
  });
}