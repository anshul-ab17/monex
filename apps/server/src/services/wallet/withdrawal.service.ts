import Decimal from "decimal.js";
import bs58 from "bs58";
import db from "@repo/db";
import { verifySignature, validateAddress } from "solana";
import { BadRequestError, NotFoundError, InsufficientBalanceError } from "../../utils/errors";
import type { WithdrawInput } from "validation";

export const withdrawalService = {
    async requestWithdrawal(userId: string, input: WithdrawInput) {
        if (!validateAddress(input.destinationAddress)) {
            throw new BadRequestError("Invalid destination address");
        }

        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError("User not found");

        // User signs: "withdraw:{userId}:{assetId}:{amount}:{destinationAddress}"
        const message = `withdraw:${userId}:${input.assetId}:${input.amount}:${input.destinationAddress}`;
        const messageBytes = new TextEncoder().encode(message);
        let sigBytes: Uint8Array;
        let pubkeyBytes: Uint8Array;
        try {
            sigBytes = bs58.decode(input.signature);
            pubkeyBytes = bs58.decode(user.walletAddress);
        } catch {
            throw new BadRequestError("Invalid signature encoding");
        }
        if (!verifySignature(messageBytes, sigBytes, pubkeyBytes)) {
            throw new BadRequestError("Invalid withdrawal signature");
        }

        const asset = await db.asset.findUnique({ where: { id: input.assetId } });
        if (!asset) throw new NotFoundError("Asset not found");

        const amount = new Decimal(input.amount);

        return db.$transaction(async (tx) => {
            const balance = await tx.balance.findUnique({
                where: { userId_assetId: { userId, assetId: input.assetId } },
            });
            if (!balance || new Decimal(balance.available.toString()).lt(amount)) {
                throw new InsufficientBalanceError();
            }
            await tx.balance.update({
                where: { userId_assetId: { userId, assetId: input.assetId } },
                data: { available: { decrement: amount.toString() } },
            });
            return tx.withdrawal.create({
                data: {
                    userId,
                    assetId: input.assetId,
                    amount: amount.toString(),
                    destinationAddress: input.destinationAddress,
                    status: "PENDING",
                },
            });
        });
    },

    async getWithdrawalsByUser(userId: string) {
        return db.withdrawal.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    },

    async getWithdrawalById(userId: string, id: string) {
        const withdrawal = await db.withdrawal.findFirst({ where: { id, userId } });
        if (!withdrawal) throw new NotFoundError("Withdrawal not found");
        return withdrawal;
    },
};
