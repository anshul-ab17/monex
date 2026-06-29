import Decimal from "decimal.js";
import db from "@repo/db";
import {
    getTransaction,
    parseTransfer,
    parseTokenTransfer,
    getMasterWallet,
    deriveTokenAccount,
    normalizeAmount,
} from "@repo/solana";
import { ledgerService } from "../ledger/ledger.service";
import { BadRequestError, NotFoundError } from "../../utils/errors";

export const depositService = {
    async submitDeposit(userId: string, txHash: string) {
        const existing = await db.deposit.findUnique({ where: { txHash } });
        if (existing) throw new BadRequestError("Transaction already processed");

        const tx = await getTransaction(txHash);
        if (!tx) throw new BadRequestError("Transaction not found on-chain");

        const masterAddress = getMasterWallet().publicKey.toBase58();

        let asset;
        let normalizedAmount: Decimal;

        const solTransfer = parseTransfer(tx);
        if (solTransfer) {
            if (solTransfer.recipient !== masterAddress) {
                throw new BadRequestError("Transaction recipient does not match deposit address");
            }
            asset = await db.asset.findFirst({ where: { isNative: true } });
            if (!asset) throw new BadRequestError("SOL asset not configured");
            normalizedAmount = new Decimal(normalizeAmount(solTransfer.amount, asset.decimals));
        } else {
            const splTransfer = parseTokenTransfer(tx);
            if (!splTransfer) throw new BadRequestError("No recognized transfer in transaction");

            asset = await db.asset.findFirst({ where: { mintAddress: splTransfer.assetId } });
            if (!asset) throw new BadRequestError("Unknown token mint in transaction");

            const ata = await deriveTokenAccount(masterAddress, asset.mintAddress!);
            if (splTransfer.recipient !== ata.toBase58()) {
                throw new BadRequestError("Transaction recipient does not match deposit address");
            }
            normalizedAmount = new Decimal(normalizeAmount(splTransfer.amount, asset.decimals));
        }

        if (normalizedAmount.lte(0)) throw new BadRequestError("Zero amount deposit");

        const deposit = await db.deposit.create({
            data: {
                userId,
                assetId: asset.id,
                txHash,
                amount: normalizedAmount.toString(),
                status: "CONFIRMED",
            },
        });

        await ledgerService.credit(userId, asset.id, normalizedAmount, deposit.id, "DEPOSIT");

        return deposit;
    },

    async getDepositsByUser(userId: string) {
        return db.deposit.findMany({
            where: { userId },
            include: { asset: { select: { symbol: true, decimals: true } } },
            orderBy: { createdAt: "desc" },
        });
    },

    async getDepositById(userId: string, id: string) {
        const deposit = await db.deposit.findFirst({
            where: { id, userId },
            include: { asset: true },
        });
        if (!deposit) throw new NotFoundError("Deposit not found");
        return deposit;
    },
};
