import { FastifyInstance } from "fastify";

import authRoutes from "./auth";
import userRoutes from "./user";
import marketRoutes from "./market";
import orderRoutes from "./order";

export default async function routes(
  app: FastifyInstance
) {
  app.register(authRoutes, {
    prefix: "/auth",
  });

  app.register(userRoutes, {
    prefix: "/user",
  });

  app.register(marketRoutes, {
    prefix: "/markets",
  });

  app.register(orderRoutes, {
    prefix: "/orders",
  });
}