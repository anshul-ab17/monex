import { kafkaProducer, KafkaTopics } from "@repo/kafka";
import { AuthEventType } from "@repo/events";
import type { UserRegisteredPayload } from "@repo/events";
import { env } from "@repo/config";
import { makeEvent } from "./make-event";

export const authPublisher = {
    async userRegistered(payload: UserRegisteredPayload) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.AUTH, makeEvent(AuthEventType.USER_REGISTERED, payload));
    },

    async userLoggedIn(payload: UserRegisteredPayload) {
        if (!env.USE_KAFKA) return;
        await kafkaProducer.publish(KafkaTopics.AUTH, makeEvent(AuthEventType.USER_LOGGED_IN, payload));
    },
};
