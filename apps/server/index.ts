import { env } from "@repo/config";

import { createHttpServer } from "./app";

async function startServer() {
    try {
        const app = await createHttpServer();

        await app.listen({
            port: Number(env.PORT) || 3000,
            host: "0.0.0.0",
        });

        app.log.info(`Server running on port ${env.PORT}`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

startServer();