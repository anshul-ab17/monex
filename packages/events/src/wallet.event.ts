import type { BaseEvent } from "./base.event";

export enum WalletEventType {
    DEPOSIT_DETECTED = "DEPOSIT_DETECTED",
    DEPOSIT_CONFIRMED = "DEPOSIT_CONFIRMED",

    WITHDRAWAL_REQUESTED = "WITHDRAWAL_REQUESTED",
    WITHDRAWAL_COMPLETED = "WITHDRAWAL_COMPLETED",
    WITHDRAWAL_FAILED = "WITHDRAWAL_FAILED",
}

export interface DepositConfirmedPayload {
    userId: string;
    assetId: string;

    amount: string;

    txHash: string;
}

export type DepositConfirmedEvent = BaseEvent<DepositConfirmedPayload>;