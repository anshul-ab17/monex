import type { BaseEvent } from "./base.event";

export enum MarketEventType {
    CREATED = "MARKET_CREATED",
    UPDATED = "MARKET_UPDATED",
    PAUSED = "MARKET_PAUSED",
}

export interface MarketCreatedPayload {
    marketId: string;

    baseAssetId: string;
    quoteAssetId: string;
}

export type MarketCreatedEvent =   BaseEvent<MarketCreatedPayload>;