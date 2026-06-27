import type { BaseEvent } from "./base.events";

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

export interface WithdrawalRequestedPayload {
  withdrawalId: string;
  userId: string;
  assetId: string;
  amount: string;
  destinationAddress: string;
}

export type DepositConfirmedEvent = BaseEvent<DepositConfirmedPayload>;
export type WithdrawalRequestedEvent =  BaseEvent<WithdrawalRequestedPayload>;
