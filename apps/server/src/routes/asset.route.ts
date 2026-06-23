import type { FastifyInstance } from "fastify";

export async function assetRoutes(app:FastifyInstance) {
    app.get("/assets", async ()=>{
        return {
            message: "all assets",
        };
    });
    app.get("assets/:symbol", async ()=>{
        return {
            message:"asset detail"
        };
    });
}