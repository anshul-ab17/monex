import type { BaseEvent } from "./base.event";

export enum OrderEventType {
    CREATED = "ORDER_CREATED",
    ACCEPTED = "ORDER_ACCEPTED",
    PARTIALLY_FILLED = "ORDER_PARTIALLY_FILLED",
    FILLED = "ORDER_FILLED",
    CANCELLED = "ORDER_CANCELLED",
    EXPIRED = "ORDER_EXPIRED",
    REJECTED = "ORDER_REJECTED",
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