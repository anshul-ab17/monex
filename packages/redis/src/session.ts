import { redis } from "./client";
import { RedisKeys } from "./keys";

const SESSION_TTL = 60 * 60 * 24 * 7;

export async function createSession(userId: string,token: string,) {
    await redis.set(
        RedisKeys.session(userId),
        token,
        "EX",
        SESSION_TTL,
    );
}

export async function getSession(userId: string) {
    return redis.get(RedisKeys.session(userId));
}

export async function deleteSession(userId: string) {
    await redis.del(RedisKeys.session(userId));
}