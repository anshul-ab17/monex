import type {FastifyInstance } from "fastify"; 

export async function depositRoutes(
  app: FastifyInstance
) {
  app.post("/deposit", async () => {
    return {
      message: "Create deposit",
    };
  });

  app.get("/deposit", async () => {
    return {
      message: "Deposit history",
    };
  });

  app.get("/deposit/:id", async () => {
    return {
      message: "Deposit details",
    };
  });
}