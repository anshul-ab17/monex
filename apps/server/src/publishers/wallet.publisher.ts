import { randomUUID } from "crypto";
import { kafkaProducer, KafkaTopics } from "@repo/kafka";
import { WalletEventType } from "@repo/events";
import type { DepositConfirmedPayload } from "@repo/events";
import { env } from "@repo/config";

export const walletPublisher = {
    async depositConfirmed(payload: DepositConfirmedPayload) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.WALLETS, {
            eventId: randomUUID(),
            eventType: WalletEventType.DEPOSIT_CONFIRMED,
            timestamp: new Date().toISOString(),
            version: 1,
            payload,
        });
    },
};
