import { redis } from "./client";

export async function setCache<T>( key: string,value: T, ttl?: number, ) {
    const data = JSON.stringify(value);

    if (ttl) { return redis.set(
        key,
        data,
        "EX",
        ttl,
        );
    }
    return redis.set(key, data);
}

export async function getCache<T>( key: string,): Promise<T | null> {
    const value = await redis.get(key);

    if (!value) { return null; }
    return JSON.parse(value);
}

export async function deleteCache(key: string) {
    await redis.del(key);
}