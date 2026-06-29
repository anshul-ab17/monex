import Decimal from "decimal.js";
import db from "@repo/db";
import { marketService } from "../market/market.service";
import { insertOrder, findOrderById, findOrdersByUser, setOrderStatus } from "./order.repository";
import { BadRequestError, NotFoundError, InsufficientBalanceError } from "../../utils/errors";
import { riskService } from "../risk/risk.service";
import type { CreateOrderInput } from "validation";

export const orderService = {
    async create(userId: string, input: CreateOrderInput) {
        const market = await marketService.assertActive(input.marketId);
        const quantity = new Decimal(input.quantity);
        const isMarket = input.type === "MARKET";
        const isStop = input.type === "STOP_LIMIT" || input.type === "STOP_MARKET";

        // MARKET orders use best available price; reserve full balance for BUY
        const price = isMarket
            ? new Decimal(0)
            : input.type === "STOP_MARKET"
                ? (input.stopPrice ? new Decimal(input.stopPrice) : new Decimal(0))
                : new Decimal(input.price!);

        const assetId = input.side === "BUY" ? market.quoteAssetId : market.baseAssetId;

        // For MARKET BUY: reserve full available balance (filled at best price)
        let reserveAmt: Decimal;
        if (isMarket && input.side === "BUY") {
            const balance = await db.balance.findUnique({
                where: { userId_assetId: { userId, assetId } },
            });
            reserveAmt = balance ? new Decimal(balance.available.toString()) : new Decimal(0);
        } else {
            reserveAmt = input.side === "BUY" ? price.mul(quantity) : quantity;
        }

        const riskCheck = await riskService.preTradeCheck({
            userId, marketId: input.marketId, side: input.side, price, quantity, assetId,
        });
        if (!riskCheck.passed) {
            throw new BadRequestError(`Risk check failed: ${riskCheck.reason}`);
        }

        const sequenceNumber = BigInt(Date.now());

        return db.$transaction(async (tx) => {
            const balance = await tx.balance.findUnique({
                where: { userId_assetId: { userId, assetId } },
            });
            if (!balance || new Decimal(balance.available.toString()).lt(reserveAmt)) {
                throw new InsufficientBalanceError();
            }

            await tx.balance.update({
                where: { userId_assetId: { userId, assetId } },
                data: {
                    available: { decrement: reserveAmt.toString() },
                    locked: { increment: reserveAmt.toString() },
                },
            });

            return insertOrder(tx, {
                userId,
                marketId: input.marketId,
                side: input.side,
                type: input.type,
                status: isStop ? "OPEN" : "PENDING",
                sequenceNumber,
                price: input.type === "STOP_MARKET" ? null : price.toString(),
                stopPrice: isStop && input.stopPrice ? new Decimal(input.stopPrice).toString() : null,
                quantity: quantity.toString(),
                remainingQty: quantity.toString(),
                timeInForce: input.timeInForce,
                postOnly: input.postOnly,
                reduceOnly: input.reduceOnly,
            });
        });
    },

    async cancel(userId: string, orderId: string) {
        const order = await findOrderById(orderId, userId);
        if (!order) throw new NotFoundError("Order not found");
        if (!["PENDING", "OPEN"].includes(order.status)) {
            throw new BadRequestError(`Cannot cancel order with status ${order.status}`);
        }

        const market = order.market;
        const remaining = new Decimal(order.remainingQty.toString());
        const price = order.price ? new Decimal(order.price.toString()) : undefined;
        const assetId = order.side === "BUY" ? market.quoteAssetId : market.baseAssetId;
        const releaseAmt = order.side === "BUY" ? price!.mul(remaining) : remaining;

        await db.$transaction(async (tx) => {
            await setOrderStatus(tx, orderId, "CANCELLED", { cancelledAt: new Date() });
            await tx.balance.update({
                where: { userId_assetId: { userId, assetId } },
                data: {
                    locked: { decrement: releaseAmt.toString() },
                    available: { increment: releaseAmt.toString() },
                },
            });
            await tx.orderEvent.create({
                data: {
                    orderId: order.id,
                    eventType: "CANCELLED",
                    remainingQty: order.remainingQty.toString(),
                },
            });
        });

        return order;
    },

    async getById(userId: string, orderId: string) {
        const order = await findOrderById(orderId, userId);
        if (!order) throw new NotFoundError("Order not found");
        return order;
    },

    async listByUser(userId: string, page: number, limit: number) {
        return findOrdersByUser(userId, page, limit);
    },
};
