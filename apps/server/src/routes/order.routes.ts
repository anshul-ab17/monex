import type {FastifyInstance } from "fastify";

export async function orderRoutes(
  app: FastifyInstance
) {
  app.post("/orders", async () => {
    return {
      message: "Create order",
    };
  });

  app.delete("/orders/:id", async () => {
    return {
      message: "Cancel order",
    };
  });

  app.get("/orders", async () => {
    return {
      message: "All orders",
    };
  });

  app.get("/orders/:id", async () => {
    return {
      message: "Single order",
    };
  });
}