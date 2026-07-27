import Decimal from "decimal.js";
import db from "@repo/db";
import { kafkaConsumer, KafkaTopics } from "@repo/kafka";
import { WalletEventType } from "@repo/events";
import type { DepositConfirmedEvent } from "@repo/events";
import { ledgerService } from "../services/ledger/ledger.service";

export async function startWalletConsumer() {
    await kafkaConsumer.subscribe<DepositConfirmedEvent>(
        "reishi-wallet-consumer",
        KafkaTopics.WALLETS,
        async (event) => {
            if (event.eventType !== WalletEventType.DEPOSIT_CONFIRMED) return;

            const { userId, assetId, amount, txHash } = event.payload;

            // Idempotency: skip if already processed
            const existing = await db.deposit.findUnique({ where: { txHash } });
            if (existing) return;

            const deposit = await db.deposit.create({
                data: { userId, assetId, txHash, amount, status: "CONFIRMED" },
            });

            await ledgerService.credit(userId, assetId, new Decimal(amount), deposit.id, "DEPOSIT");
        },
    );
}
