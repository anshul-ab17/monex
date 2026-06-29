import "@fastify/jwt";
import "fastify";

import type db from "@repo/db";
import type { Redis } from "ioredis";
import type { kafkaProducer, kafkaConsumer } from "@repo/kafka";
import type { JwtPayload } from "@repo/types";

declare module "fastify" {
    interface FastifyInstance {
        prisma: typeof db;
        redis: Redis;
        producer: typeof kafkaProducer;
        consumer: typeof kafkaConsumer;
    }
    interface FastifyRequest {
        correlationId: string;
    }
}

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: JwtPayload;
        user: JwtPayload;
    }
}
