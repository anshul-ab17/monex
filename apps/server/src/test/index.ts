import type {FastifyInstance } from "fastify";
import { tests } from "./test";

export default async function routes(
  app: FastifyInstance
) {
  await tests(app);
}