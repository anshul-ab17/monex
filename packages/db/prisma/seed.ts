import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: Bun.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    // ── Assets ──────────────────────────────────────────────────────────────
    const sol = await prisma.asset.upsert({
        where: { symbol: "SOL" },
        create: {
            symbol: "SOL",
            name: "Solana",
            decimals: 9,
            isNative: true,
        },
        update: {},
    });

    const usdc = await prisma.asset.upsert({
        where: { symbol: "USDC" },
        create: {
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            mintAddress: Bun.env.USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        },
        update: {},
    });

    const usdt = await prisma.asset.upsert({
        where: { symbol: "USDT" },
        create: {
            symbol: "USDT",
            name: "Tether USD",
            decimals: 6,
            mintAddress: Bun.env.USDT_MINT ?? "Ejmc6tyoj6rJ3N6qWfD1WjV22V1P3moxGZ5Z85F94G1q",
        },
        update: {},
    });

    console.log("Assets seeded:", sol.symbol, usdc.symbol, usdt.symbol);

    // ── Markets ──────────────────────────────────────────────────────────────
    const solUsdc = await prisma.market.upsert({
        where: { symbol: "SOL/USDC" },
        create: {
            symbol: "SOL/USDC",
            name: "SOL / USDC",
            type: "SPOT",
            baseAssetId: sol.id,
            quoteAssetId: usdc.id,
            tickSize: "0.01",
            stepSize: "0.001",
            minOrderSize: "0.001",
        },
        update: {},
    });

    const solUsdt = await prisma.market.upsert({
        where: { symbol: "SOL/USDT" },
        create: {
            symbol: "SOL/USDT",
            name: "SOL / USDT",
            type: "SPOT",
            baseAssetId: sol.id,
            quoteAssetId: usdt.id,
            tickSize: "0.01",
            stepSize: "0.001",
            minOrderSize: "0.001",
        },
        update: {},
    });

    console.log("Markets seeded:", solUsdc.symbol, solUsdt.symbol);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
