import type {FastifyInstance } from "fastify";


import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { marketRoutes } from "./market.routes";
import { assetRoutes } from "./asset.route";
import { orderRoutes } from "./order.routes";
import { walletRoutes } from "./wallet.routes";
import { depositRoutes } from "./deposit.routes";
import { withdrawalRoutes } from "./withdrawal.routes";
import { tradeRoutes } from "./trade.routes";
import { predictionRoutes } from "./prediction.routes";

export default async function routes(
  app: FastifyInstance
) {
  await authRoutes(app);
  await userRoutes(app);
  await walletRoutes(app);
  await assetRoutes(app);
  await marketRoutes(app);
  await orderRoutes(app);
  await depositRoutes(app);
  await withdrawalRoutes(app);
  await tradeRoutes(app);
  await predictionRoutes(app);
}