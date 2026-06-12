export interface BaseEvent<TPayload = unknown> {
    eventId: string;
    eventType: string;
    timestamp: string;
    payload: TPayload;
}