import type { BaseEvent } from "./base.events";

export enum TradeEventType {
    EXECUTED = "TRADE_EXECUTED",
    SETTLED = "TRADE_SETTLED",
}

export interface TradeExecutedPayload {
    tradeId: string;

    buyOrderId: string;
    sellOrderId: string;
    buyerId: string;
    sellerId: string;
    quantity: string;
    price: string;
    makerFee: string;
    takerFee: string;
}

export type TradeExecutedEvent =  BaseEvent<TradeExecutedPayload>;