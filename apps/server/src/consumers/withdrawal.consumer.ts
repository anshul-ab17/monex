import Decimal from "decimal.js";
import db from "@repo/db";
import { kafkaConsumer, KafkaTopics } from "@repo/kafka";
import { WalletEventType } from "@repo/events";
import type { WithdrawalRequestedEvent } from "@repo/events";
import { getMasterWallet, sendSol, sendToken } from "@repo/solana";

export async function startWithdrawalConsumer() {
    await kafkaConsumer.subscribe<WithdrawalRequestedEvent>(
        "monex-withdrawal-consumer",
        KafkaTopics.WALLETS,
        async (event) => {
            if (event.eventType !== WalletEventType.WITHDRAWAL_REQUESTED) return;

            const { withdrawalId, userId, assetId, amount, destinationAddress } = event.payload;

            // Idempotency: skip if already processed
            const withdrawal = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
            if (!withdrawal || withdrawal.status !== "PENDING") return;

            const asset = await db.asset.findUnique({ where: { id: assetId } });
            if (!asset) return;

            const masterWallet = getMasterWallet();
            const amountDecimal = new Decimal(amount);

            try {
                let txHash: string;
                if (asset.isNative) {
                    txHash = await sendSol(masterWallet, destinationAddress, amountDecimal);
                } else {
                    if (!asset.mintAddress) throw new Error(`Asset ${assetId} missing mintAddress`);
                    txHash = await sendToken(masterWallet, destinationAddress, asset.mintAddress, amountDecimal, asset.decimals);
                }

                await db.withdrawal.update({
                    where: { id: withdrawalId },
                    data: { status: "COMPLETED", txHash },
                });
            } catch (err) {
                const reason = err instanceof Error ? err.message : String(err);

                // Credit balance back on failure
                await db.$transaction(async (tx) => {
                    await tx.withdrawal.update({
                        where: { id: withdrawalId },
                        data: { status: "FAILED", failureReason: reason },
                    });
                    await tx.balance.update({
                        where: { userId_assetId: { userId, assetId } },
                        data: { available: { increment: amountDecimal.toString() } },
                    });
                });
            }
        },
    );
}
