import "fastify";
import type { PrismaClient } from "@repo/db";
import type { RedisClientType } from "redis";

declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient
        redis: RedisClientType;
    }
}
