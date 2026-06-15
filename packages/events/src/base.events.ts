export interface BaseEvent<TPayload> {
    eventId: string;
    eventType: string;
    timestamp: string;
    version: number;
    payload: TPayload;
}


