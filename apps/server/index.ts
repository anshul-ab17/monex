import fastify from "fastify";
import cors from "@fastify/cors";

import { env } from "@repo/config";
import routes from "./routes";

const app = fastify({
  logger: true
});

await app.register(cors, {
  origin: env.FRONTEND_URL,
  credentials:true
});


app.get("/health", async(_request, _reply) =>({
    status: "ok"
}));

await app.register(routes, {
  prefix: "/api/v1",
});

app.listen({
  port:Number(env.PORT) || 3000,
  host: "0.0.0.0"
});
console.log(`server is running on :${env.PORT}`);
