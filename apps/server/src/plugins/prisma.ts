import fp from "fastify-plugin";
import db from "@repo/db";

export default fp(async (app) => {
    app.decorate("prisma",db);
    app.addHook("onClose", async()=>{
        await db.$disconnect();
    });
});