import { redis } from "@repo/redis";

export const userEventsService = {
    async publishOrderUpdate(userId: string, data: {
        orderId: string;
        status: string;
        marketId: string;
        filledQty?: string;
        remainingQty?: string;
        price?: string;
    }) {
        await redis.publish(`user:${userId}`, JSON.stringify({
            event: "order_update",
            payload: data,
        }));
    },

    async publishBalanceChange(userId: string, data: {
        assetId: string;
        available: string;
        locked: string;
        changeType: "TRADE" | "DEPOSIT" | "WITHDRAWAL" | "FUNDING" | "LIQUIDATION";
    }) {
        await redis.publish(`user:${userId}`, JSON.stringify({
            event: "balance_change",
            payload: data,
        }));
    },

    async publishPositionUpdate(userId: string, data: {
        marketId: string;
        side: string;
        quantity: string;
        avgEntryPrice: string;
        unrealizedPnl?: string;
    }) {
        await redis.publish(`user:${userId}`, JSON.stringify({
            event: "position_update",
            payload: data,
        }));
    },

    async publishLiquidation(userId: string, data: {
        marketId: string;
        side: string;
        closedQty: string;
        markPrice: string;
        realizedLoss: string;
    }) {
        await redis.publish(`user:${userId}`, JSON.stringify({
            event: "liquidation",
            payload: data,
        }));
    },
};
