import { redis } from "./client";
import { RedisKeys } from "./keys";

const NONCE_TTL = 300;

export async function storeNonce(wallet: string, nonce: string) {
  await redis.set(
    RedisKeys.nonce(wallet),
    nonce,
    "EX",
    NONCE_TTL,
  );
}

export async function getNonce(wallet: string) {
    return redis.get(
        RedisKeys.nonce(wallet),
    );
}

export async function deleteNonce( wallet: string ) {
    await redis.del( RedisKeys.nonce(wallet));
}