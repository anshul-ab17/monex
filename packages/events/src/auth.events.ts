import type { BaseEvent } from "./base.events";

export enum AuthEventType {
    USER_REGISTERED = "USER_REGISTERED",
    USER_LOGGED_IN = "USER_LOGGED_IN",
}

export interface UserRegisteredPayload {
    userId: string;
    walletAddress: string;
}

export type UserRegisteredEvent = BaseEvent<UserRegisteredPayload>;