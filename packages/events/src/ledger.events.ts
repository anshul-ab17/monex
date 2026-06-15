import type { BaseEvent } from "./base.events";

export enum LedgerEventType {
  FUNDS_RESERVED = "FUNDS_RESERVED",
  FUNDS_RELEASED = "FUNDS_RELEASED",

  BALANCE_CREDITED = "BALANCE_CREDITED",
  BALANCE_DEBITED = "BALANCE_DEBITED",
  TRADE_SETTLED = "TRADE_SETTLED",
}
 
export interface FundsReservedPayload {
  userId: string;
  assetId: string;
  amount: string;
}


export interface TradeSettledPayload {
  tradeId: string;
}


export interface FundsReleasedPayload {
  userId: string;
  assetId: string;

  amount: string;

  referenceId: string;
}
export interface BalanceCreditedPayload {
  userId: string;
  assetId: string;

  amount: string;

  referenceId: string;
}

export type BalanceCreditedEvent = BaseEvent<BalanceCreditedPayload>;

export type FundsReleasedEvent =  BaseEvent<FundsReleasedPayload>;
export type FundsReservedEvent = BaseEvent<FundsReservedPayload>;
export type TradeSettledEvent =  BaseEvent<TradeSettledPayload>;