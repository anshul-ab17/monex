import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export default fp(async (app: FastifyInstance) => {
    await app.register(swagger, {
        openapi: {
            openapi: "3.1.0",
            info: {
                title: "Monex API",
                description: "Decentralized Solana crypto exchange — spot, prediction markets, perpetuals",
                version: "1.0.0",
                contact: { name: "Anshul Bharat", email: "anshul.ab17x@gmail.com" },
            },
            servers: [
                { url: "http://localhost:3001", description: "Local" },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
            tags: [
                { name: "Auth", description: "Wallet-based authentication" },
                { name: "User", description: "User profile" },
                { name: "Assets", description: "Supported assets" },
                { name: "Markets", description: "Trading pairs and market data" },
                { name: "Orders", description: "Order placement and management" },
                { name: "Trades", description: "Trade history" },
                { name: "Wallet", description: "Balances and deposit addresses" },
                { name: "Deposits", description: "On-chain deposit tracking" },
                { name: "Withdrawals", description: "Withdrawal requests" },
                { name: "Portfolio", description: "Portfolio and fee tiers" },
                { name: "Predictions", description: "Prediction markets" },
                { name: "Oracle", description: "Pyth oracle price feeds" },
                { name: "Margin", description: "Isolated margin accounts" },
            ],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
            docExpansion: "list",
            deepLinking: true,
        },
    });
});
