import fastify from "fastify";

const app = fastify();

app.get("/health", async() =>{
  return {
    status: "ok"
  };
});

app.listen({
  port: 3000,
  host: "0.0.0.0"
});

