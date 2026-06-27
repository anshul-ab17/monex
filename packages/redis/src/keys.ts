export const RedisKeys = {
    nonce: (wallet: string) => `nonce:${wallet}`,
    session: (userId: string) => `session:${userId}`,

    market: (marketId: string) => `market:${marketId}`,
    orderbook: (marketId: string) => `orderbook:${marketId}`,
};