import Decimal from "decimal.js";
import db from "@repo/db";

const MAX_POSITION_SIZE = new Decimal("1000000");
const MAX_ORDER_VALUE = new Decimal("100000");
const MAX_OPEN_ORDERS_PER_MARKET = 100;

export interface RiskCheckInput {
    userId: string;
    marketId: string;
    side: "BUY" | "SELL";
    price: Decimal;
    quantity: Decimal;
    assetId: string;
}

export interface RiskCheckResult {
    passed: boolean;
    reason?: string;
}

export class RiskService {
    async preTradeCheck(input: RiskCheckInput): Promise<RiskCheckResult> {
        const { userId, marketId, side, price, quantity, assetId } = input;
        const orderValue = price.mul(quantity);

        if (orderValue.gt(MAX_ORDER_VALUE)) {
            return { passed: false, reason: `Order value ${orderValue} exceeds max ${MAX_ORDER_VALUE}` };
        }

        const [balance, openOrderCount, position] = await Promise.all([
            db.balance.findUnique({
                where: { userId_assetId: { userId, assetId } },
            }),
            db.order.count({
                where: { userId, marketId, status: { in: ["OPEN", "PARTIALLY_FILLED"] } },
            }),
            db.position.findFirst({
                where: { userId, marketId },
            }),
        ]);

        if (!balance) {
            return { passed: false, reason: "No balance found" };
        }

        const available = new Decimal(balance.available.toString());
        const required = side === "BUY" ? orderValue : quantity;

        if (available.lt(required)) {
            return { passed: false, reason: `Insufficient balance: ${available} < ${required}` };
        }

        if (openOrderCount >= MAX_OPEN_ORDERS_PER_MARKET) {
            return { passed: false, reason: `Too many open orders (max ${MAX_OPEN_ORDERS_PER_MARKET})` };
        }

        if (position) {
            const currentSize = new Decimal(position.quantity.toString());
            const newSize = currentSize.add(quantity);
            if (newSize.gt(MAX_POSITION_SIZE)) {
                return { passed: false, reason: `Position would exceed max size ${MAX_POSITION_SIZE}` };
            }
        }

        return { passed: true };
    }
}

export const riskService = new RiskService();
