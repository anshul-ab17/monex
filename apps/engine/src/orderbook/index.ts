import db from "@repo/db";
import Decimal from "decimal.js";
import { OrderBookPair } from "./order-book";

export { OrderBookPair, type BookOrder, type MatchResult } from "./order-book";
export { OrderNode } from "./order-node";
export { PriceLevel } from "./price-level";
export { BPlusTree } from "./bplus-tree";

class OrderBookStore {
    private books = new Map<string, OrderBookPair>();

    get(marketId: string): OrderBookPair {
        if (!this.books.has(marketId)) this.books.set(marketId, new OrderBookPair(marketId));
        return this.books.get(marketId)!;
    }

    async loadFromDb(): Promise<void> {
        const orders = await db.order.findMany({
            where: { status: { in: ["OPEN", "PENDING"] }, type: "LIMIT" },
        });
        for (const o of orders) {
            if (!o.price) continue;
            this.get(o.marketId).add({
                orderId: o.id,
                userId: o.userId,
                marketId: o.marketId,
                side: o.side as "BUY" | "SELL",
                price: new Decimal(o.price.toString()),
                remainingQty: new Decimal(o.remainingQty.toString()),
                sequenceNumber: o.sequenceNumber,
                timeInForce: o.timeInForce,
                postOnly: o.postOnly,
            });
        }
        console.log(`[engine] loaded ${orders.length} orders into order books`);
    }
}

export const orderBookStore = new OrderBookStore();
