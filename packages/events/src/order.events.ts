import type { BaseEvent } from "./base.events";

export enum OrderEventType {
    CREATED = "ORDER_CREATED",
    ACCEPTED = "ORDER_ACCEPTED",
    PARTIALLY_FILLED = "ORDER_PARTIALLY_FILLED",
    FILLED = "ORDER_FILLED",
    CANCELLED = "ORDER_CANCELLED",
    EXPIRED = "ORDER_EXPIRED",
    REJECTED = "ORDER_REJECTED",
     
    RESERVE_REQUESTED = "ORDER_RESERVE_REQUESTED",
    RELEASE_REQUESTED = "ORDER_RELEASE_REQUESTED",
}

export interface OrderCreatedPayload {
    orderId: string;
    userId: string;
    marketId: string;

    side: string;
    type: string;

    quantity: string;
    price?: string;
}

export type OrderCreatedEvent =  BaseEvent<OrderCreatedPayload>;