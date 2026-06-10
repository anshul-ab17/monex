import type {FastifyInstance } from "fastify";

export async function userRoutes(
  app: FastifyInstance
) {
  app.get("/api/user/me", async () => {
    return {
      message: "Current user",
    };
  });

  app.patch("/api/user/me", async () => {
    return {
      message: "Update profile",
    };
  });
}