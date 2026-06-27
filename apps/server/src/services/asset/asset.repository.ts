import db from "@repo/db";

export async function findAllAssets() {
    return db.asset.findMany({
        orderBy: { symbol: "asc" },
    });
}

export async function findAssetById(id: string) {
    return db.asset.findUnique({ where: { id } });
}

export async function findAssetBySymbol(symbol: string) {
    return db.asset.findUnique({ where: { symbol } });
}
