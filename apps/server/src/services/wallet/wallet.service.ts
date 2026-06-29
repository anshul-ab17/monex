import db from "@repo/db";
import { getMasterWallet, deriveTokenAccount } from "@repo/solana";
import { NotFoundError } from "../../utils/errors";

export const walletService = {
    async getBalances(userId: string) {
        return db.balance.findMany({
            where: { userId },
            include: { asset: { select: { symbol: true, name: true, decimals: true, isNative: true } } },
            orderBy: { asset: { symbol: "asc" } },
        });
    },

    // ponytail: single master wallet for all deposits; per-user HD derivation deferred
    async getDepositAddress(assetId: string) {
        const asset = await db.asset.findUnique({ where: { id: assetId } });
        if (!asset) throw new NotFoundError("Asset not found");

        const masterAddress = getMasterWallet().publicKey.toBase58();

        if (asset.isNative) return { address: masterAddress, asset };

        const ata = await deriveTokenAccount(masterAddress, asset.mintAddress!);
        return { address: ata.toBase58(), asset };
    },
};
