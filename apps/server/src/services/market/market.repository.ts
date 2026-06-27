import db from "@repo/db";

export async function findAllMarkets(activeOnly = true) {
    return db.market.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        include: { baseAsset: true, quoteAsset: true },
        orderBy: { symbol: "asc" },
    });
}

export async function findMarketById(id: string) {
    return db.market.findUnique({
        where: { id },
        include: { baseAsset: true, quoteAsset: true },
    });
}

export async function findMarketBySymbol(symbol: string) {
    return db.market.findUnique({
        where: { symbol },
        include: { baseAsset: true, quoteAsset: true },
    });
}
