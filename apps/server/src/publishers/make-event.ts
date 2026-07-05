import { randomUUID } from "crypto";

export function makeEvent<T>(eventType: string, payload: T) {
    return { eventId: randomUUID(), eventType, timestamp: new Date().toISOString(), version: 1, payload };
}
