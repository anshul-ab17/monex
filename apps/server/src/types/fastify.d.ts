import "fastify";

import type { PrismaClient } from "@repo/db";
import type { RedisClientType } from "redis";
import type { kafkaProducer, kafkaConsumer } from "@repo/kafka";

declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient;
        redis: RedisClientType;
        producer: KafkaProducer;
        consumer: KafkaConsumer;
    }
}

