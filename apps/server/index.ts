import fastify from "fastify";
import { env } from "@repo/config";

const app = fastify();

app.get("/health", async() =>{
  return {
    status: "ok"
  };
});

app.listen({
  port:Number(env.PORT) || 3000,
  host: "0.0.0.0"
});
console.log(`server is running on :${env.PORT}`);
