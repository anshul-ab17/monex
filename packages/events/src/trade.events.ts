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
    marketId: string;
    quantity: string;
    price: string;
    makerFee: string;
    takerFee: string;
    takerSide: "BUY" | "SELL";
}

export type TradeExecutedEvent =  BaseEvent<TradeExecutedPayload>;