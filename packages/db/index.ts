import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: Bun.env.DATABASE_URL!,
});

// console.log("DATABASE_URL =", process.env.DATABASE_URL);

const prisma = new PrismaClient({
  adapter,
});

export default prisma;