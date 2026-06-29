import Decimal from "decimal.js";
import bs58 from "bs58";
import db from "@repo/db";
import { redis } from "@repo/redis";
import { verifySignature, validateAddress } from "solana";
import { BadRequestError, NotFoundError, InsufficientBalanceError } from "../../utils/errors";
import type { WithdrawInput } from "validation";

const COOLDOWN_SECONDS = 24 * 60 * 60; // 24 hours
const DAILY_LIMIT = new Decimal("10000"); // USDC equivalent daily limit

function addressCooldownKey(userId: string, address: string) {
    return `withdrawal:cooldown:${userId}:${address}`;
}

function dailyVolumeKey(userId: string) {
    const day = new Date().toISOString().slice(0, 10);
    return `withdrawal:daily:${userId}:${day}`;
}

export const withdrawalService = {
    async requestWithdrawal(userId: string, input: WithdrawInput) {
        if (!validateAddress(input.destinationAddress)) {
            throw new BadRequestError("Invalid destination address");
        }

        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError("User not found");

        // Signature verification
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

        // 24h cooldown for new destination addresses
        const cooldownKey = addressCooldownKey(userId, input.destinationAddress);
        const knownSince = await redis.get(cooldownKey);

        if (!knownSince) {
            // First time this address is used: register it with current timestamp
            await redis.set(cooldownKey, Date.now().toString());
            throw new BadRequestError(
                "New withdrawal address requires a 24-hour review period. Please retry after 24 hours."
            );
        }

        const registeredAt = Number(knownSince);
        const elapsedMs = Date.now() - registeredAt;
        if (elapsedMs < COOLDOWN_SECONDS * 1000) {
            const remainingHours = Math.ceil((COOLDOWN_SECONDS * 1000 - elapsedMs) / 3_600_000);
            throw new BadRequestError(
                `New address cooldown active. Retry in ${remainingHours} hour(s).`
            );
        }

        const amount = new Decimal(input.amount);

        // Daily limit check
        const dailyKey = dailyVolumeKey(userId);
        const dailyUsed = await redis.get(dailyKey);
        const totalToday = dailyUsed ? new Decimal(dailyUsed).add(amount) : amount;
        if (totalToday.gt(DAILY_LIMIT)) {
            throw new BadRequestError(
                `Daily withdrawal limit of ${DAILY_LIMIT.toString()} exceeded.`
            );
        }

        const withdrawal = await db.$transaction(async (tx) => {
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

        // Track daily volume (TTL: 48h to survive across midnight)
        await redis.set(dailyKey, totalToday.toString(), "EX", 172800);

        return withdrawal;
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
