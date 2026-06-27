import { randomUUID } from "crypto";
import { kafkaProducer } from "@repo/kafka";
import { KafkaTopics } from "@repo/kafka";
import { AuthEventType } from "@repo/events";
import type { UserRegisteredPayload } from "@repo/events";
import { env } from "@repo/config";

export const authPublisher = {
    async userRegistered(payload: UserRegisteredPayload) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.AUTH, {
            eventId: randomUUID(),
            eventType: AuthEventType.USER_REGISTERED,
            timestamp: new Date().toISOString(),
            version: 1,
            payload,
        });
    },

    async userLoggedIn(payload: UserRegisteredPayload) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.AUTH, {
            eventId: randomUUID(),
            eventType: AuthEventType.USER_LOGGED_IN,
            timestamp: new Date().toISOString(),
            version: 1,
            payload,
        });
    },
};
