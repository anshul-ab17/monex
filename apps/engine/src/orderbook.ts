import Decimal from "decimal.js";
import db from "@repo/db";

export interface BookOrder {
    orderId: string;
    userId: string;
    marketId: string;
    side: "BUY" | "SELL";
    price: Decimal;
    remainingQty: Decimal;
    sequenceNumber: bigint;
    timeInForce: string;
    postOnly: boolean;
}

export interface MatchResult {
    makerOrderId: string;
    makerUserId: string;
    makerRemainingQtyBefore: Decimal;
    price: Decimal;
    quantity: Decimal;
}

export class OrderBook {
    // bids: price DESC, seq ASC; asks: price ASC, seq ASC
    private bids: BookOrder[] = [];
    private asks: BookOrder[] = [];

    constructor(readonly marketId: string) {}

    add(order: BookOrder) {
        if (order.side === "BUY") {
            this.bids.push(order);
            this.bids.sort((a, b) => {
                const pd = b.price.cmp(a.price);
                return pd !== 0 ? pd : a.sequenceNumber < b.sequenceNumber ? -1 : 1;
            });
        } else {
            this.asks.push(order);
            this.asks.sort((a, b) => {
                const pd = a.price.cmp(b.price);
                return pd !== 0 ? pd : a.sequenceNumber < b.sequenceNumber ? -1 : 1;
            });
        }
    }

    remove(orderId: string, side: "BUY" | "SELL") {
        if (side === "BUY") this.bids = this.bids.filter((o) => o.orderId !== orderId);
        else this.asks = this.asks.filter((o) => o.orderId !== orderId);
    }

    match(incoming: BookOrder): MatchResult[] {
        const results: MatchResult[] = [];
        let remaining = incoming.remainingQty;
        const makers = incoming.side === "BUY" ? this.asks : this.bids;

        for (const maker of makers) {
            if (remaining.isZero()) break;
            if (incoming.side === "BUY" && maker.price.gt(incoming.price)) break;
            if (incoming.side === "SELL" && maker.price.lt(incoming.price)) break;

            const execQty = Decimal.min(remaining, maker.remainingQty);
            results.push({
                makerOrderId: maker.orderId,
                makerUserId: maker.userId,
                makerRemainingQtyBefore: maker.remainingQty,
                price: maker.price,
                quantity: execQty,
            });
            remaining = remaining.sub(execQty);
        }

        return results;
    }

    applyMatches(matches: MatchResult[], takerSide: "BUY" | "SELL") {
        const makers = takerSide === "BUY" ? this.asks : this.bids;
        for (const match of matches) {
            const maker = makers.find((o) => o.orderId === match.makerOrderId);
            if (!maker) continue;
            maker.remainingQty = maker.remainingQty.sub(match.quantity);
            if (maker.remainingQty.isZero()) this.remove(maker.orderId, maker.side);
        }
    }

    wouldMatch(order: BookOrder): boolean {
        const best = (order.side === "BUY" ? this.asks : this.bids)[0];
        if (!best) return false;
        return order.side === "BUY" ? best.price.lte(order.price) : best.price.gte(order.price);
    }
}

class OrderBookStore {
    private books = new Map<string, OrderBook>();

    get(marketId: string): OrderBook {
        if (!this.books.has(marketId)) this.books.set(marketId, new OrderBook(marketId));
        return this.books.get(marketId)!;
    }

    async loadFromDb() {
        // ponytail: full in-memory load; sharded/persisted state deferred
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
