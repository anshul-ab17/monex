import { kafkaProducer, KafkaTopics } from "@repo/kafka";
import { WalletEventType } from "@repo/events";
import type { DepositConfirmedPayload, WithdrawalRequestedPayload } from "@repo/events";
import { env } from "@repo/config";
import { makeEvent } from "./make-event";

export const walletPublisher = {
    async depositConfirmed(payload: DepositConfirmedPayload) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.WALLETS, makeEvent(WalletEventType.DEPOSIT_CONFIRMED, payload));
    },

    async withdrawalRequested(payload: WithdrawalRequestedPayload) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.WALLETS, makeEvent(WalletEventType.WITHDRAWAL_REQUESTED, payload));
    },
};
