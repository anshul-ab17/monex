import type db from "@repo/db";

type Tx = Parameters<Parameters<(typeof db)["$transaction"]>[0]>[0];

export async function getOrCreateUserAccount(
    tx: Tx,
    userId: string,
    assetId: string,
) {
    const existing = await tx.ledgerAccount.findFirst({
        where: { userId, assetId, type: "USER" },
        select: { id: true },
    });
    if (existing) return existing;
    return tx.ledgerAccount.create({
        data: { userId, assetId, type: "USER" },
        select: { id: true },
    });
}

export async function getUserAccount(
    tx: Tx,
    userId: string,
    assetId: string,
) {
    const account = await tx.ledgerAccount.findFirst({
        where: { userId, assetId, type: "USER" },
        select: { id: true },
    });
    if (!account) {
        throw new Error(`LedgerAccount not found user=${userId} asset=${assetId}`);
    }
    return account;
}

export async function getOrCreateSystemAccount(
    tx: Tx,
    assetId: string,
    type: "FEES" | "EXCHANGE",
) {
    const existing = await tx.ledgerAccount.findFirst({
        where: { assetId, type, userId: null },
        select: { id: true },
    });
    if (existing) return existing;
    return tx.ledgerAccount.create({
        data: { assetId, type },
        select: { id: true },
    });
}
