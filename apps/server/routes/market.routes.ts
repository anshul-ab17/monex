import type {FastifyInstance } from "fastify";

export async function marketRoutes(
  app: FastifyInstance
) {
  app.get("/markets", async () => {
    return {
      message: "All markets",
    };
  });

  app.get("/markets/:id", async () => {
    return {
      message: "Single market",
    };
  });

  app.post("/markets", async () => {
    return {
      message: "Create market",
    };
  });

  app.patch("/markets/:id", async () => {
    return {
      message: "Update market",
    };
  });
}