import type {FastifyInstance } from "fastify";

export async function authRoutes(
  app: FastifyInstance
) {
  app.post("/auth/nonce", async () => {
    return {
      message: "Generate nonce",
    };
  });

  app.post("/auth/wallet", async () => {
    return {
      message: "Wallet login",
    };
  });

  app.post("/auth/refresh", async () => {
    return {
      message: "Refresh token",
    };
  });

  app.post("/auth/logout", async () => {
    return {
      message: "Logout",
    };
  });
}