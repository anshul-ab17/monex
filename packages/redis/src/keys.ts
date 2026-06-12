export const RedisKeys = {
    nonce: (wallet: string) => `nonce:${wallet}`,
    session: (userId: string) => `nonce:${userId}`,

    market: (marketId: string) => `nonce:${marketId}`,
    orderbook: (marketId: string) => `nonce:${marketId}`
};