import type {FastifyInstance } from "fastify";

export async function userRoutes(
  app: FastifyInstance
) {
  app.get("user/me", async () => {
    return {
      message: "Current user",
    };
  });

  app.patch("user/me", async () => {
    return {
      message: "Update profile",
    };
  });
}