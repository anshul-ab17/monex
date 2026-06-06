import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: Bun.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({
  adapter,
});