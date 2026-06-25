import "@fastify/jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: {
            userId: string;
            walletAddress: string;
            sessionId: string;
        };

        user: {
            userId: string;
            walletAddress: string;
            sessionId: string;
        };
    }
}