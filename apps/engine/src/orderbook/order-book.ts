import Decimal from "decimal.js";
import { OrderNode, priceToBigint } from "./order-node";
import { PriceLevel } from "./price-level";
import { BPlusTree, type LeafNode } from "./bplus-tree";

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
    makerNode: OrderNode;
}

class OrderBookSide {
    private orderMap = new Map<string, OrderNode>();
    private priceMap = new Map<bigint, PriceLevel>();
    private priceTree = new BPlusTree<PriceLevel>(64);
    private emptyLevelCount = 0;

    constructor(
        readonly marketId: string,
        readonly side: "BUY" | "SELL",
    ) {}

    add(order: BookOrder): void {
        const priceKey = priceToBigint(order.price);
        const node = new OrderNode({
            orderId: order.orderId,
            userId: order.userId,
            marketId: order.marketId,
            side: order.side,
            remainingQty: order.remainingQty,
            sequenceNumber: order.sequenceNumber,
            timeInForce: order.timeInForce,
            postOnly: order.postOnly,
            price: priceKey,
            decimalPrice: order.price,
        });

        this.orderMap.set(order.orderId, node);

        let level = this.priceMap.get(priceKey);
        if (!level) {
            level = new PriceLevel(priceKey);
            this.priceMap.set(priceKey, level);
            this.priceTree.insert(priceKey, level);
        } else if (level.isEmpty()) {
            // ponytail: level was empty/stale, re-activating it
            this.emptyLevelCount--;
        }
        level.append(node);
    }

    remove(orderId: string): void {
        const node = this.orderMap.get(orderId);
        if (!node) return;
        const level = node.priceLevel;
        if (level) {
            level.remove(node);
            if (level.isEmpty()) {
                this.emptyLevelCount++;
                this.maybeCleanup();
            }
        }
        this.orderMap.delete(orderId);
    }

    /**
     * match() is read-only. Call applyMatches() to mutate state.
     * isBuy=true → scanning asks ascending (min price first)
     * isBuy=false → scanning bids descending (max price first)
     */
    match(incomingPrice: bigint, incomingQty: Decimal, isBuy: boolean): MatchResult[] {
        const results: MatchResult[] = [];
        let remaining = incomingQty;

        let leaf: LeafNode<PriceLevel> | null;
        let keyIdx: number;

        if (isBuy) {
            leaf = this.priceTree.minLeaf();
            keyIdx = 0;
        } else {
            leaf = this.priceTree.maxLeaf();
            keyIdx = leaf ? leaf.keys.length - 1 : -1;
        }

        if (isBuy) {
            while (leaf && !remaining.isZero()) {
                while (keyIdx < leaf.keys.length && !remaining.isZero()) {
                    const level = leaf.values[keyIdx]!;
                    if (level.isEmpty()) {
                        // ponytail: lazy cleanup — splice shifts next element into keyIdx, don't increment
                        this.cleanupLevel(level);
                        continue;
                    }
                    if (level.price > incomingPrice) return results;

                    let orderNode = level.head;
                    while (orderNode && !remaining.isZero()) {
                        const execQty = Decimal.min(remaining, orderNode.remainingQty);
                        results.push({
                            makerOrderId: orderNode.orderId,
                            makerUserId: orderNode.userId,
                            makerRemainingQtyBefore: orderNode.remainingQty,
                            price: orderNode.decimalPrice,
                            quantity: execQty,
                            makerNode: orderNode,
                        });
                        remaining = remaining.sub(execQty);
                        orderNode = orderNode.next;
                    }
                    keyIdx++;
                }
                leaf = leaf.next;
                keyIdx = 0;
            }
        } else {
            while (leaf && !remaining.isZero()) {
                while (keyIdx >= 0 && !remaining.isZero()) {
                    const level = leaf.values[keyIdx]!;
                    if (level.isEmpty()) {
                        // ponytail: descending — splice removes keyIdx, so decrement is correct
                        this.cleanupLevel(level);
                        keyIdx--;
                        continue;
                    }
                    if (level.price < incomingPrice) return results;

                    let orderNode = level.head;
                    while (orderNode && !remaining.isZero()) {
                        const execQty = Decimal.min(remaining, orderNode.remainingQty);
                        results.push({
                            makerOrderId: orderNode.orderId,
                            makerUserId: orderNode.userId,
                            makerRemainingQtyBefore: orderNode.remainingQty,
                            price: orderNode.decimalPrice,
                            quantity: execQty,
                            makerNode: orderNode,
                        });
                        remaining = remaining.sub(execQty);
                        orderNode = orderNode.next;
                    }
                    keyIdx--;
                }
                leaf = leaf.prev;
                keyIdx = leaf ? leaf.keys.length - 1 : -1;
            }
        }

        return results;
    }

    applyMatches(matches: MatchResult[]): void {
        for (const m of matches) {
            const node = m.makerNode;
            node.remainingQty = node.remainingQty.sub(m.quantity);
            const level = node.priceLevel;
            if (level) {
                level.totalQty = level.totalQty.sub(m.quantity);
            }
            if (node.remainingQty.isZero()) {
                if (level) {
                    level.remove(node); // sets node.priceLevel = null internally
                    if (level.isEmpty()) {
                        this.emptyLevelCount++;
                    }
                }
                this.orderMap.delete(node.orderId);
            }
        }
        this.maybeCleanup();
    }

    bestPrice(): Decimal | null {
        if (this.side === "BUY") {
            const entry = this.priceTree.maxEntry();
            if (!entry) return null;
            const level = entry.value;
            if (level.isEmpty()) return null;
            return level.head!.decimalPrice;
        } else {
            const entry = this.priceTree.minEntry();
            if (!entry) return null;
            const level = entry.value;
            if (level.isEmpty()) return null;
            return level.head!.decimalPrice;
        }
    }

    getOrder(orderId: string): OrderNode | undefined {
        return this.orderMap.get(orderId);
    }

    private cleanupLevel(level: PriceLevel): void {
        this.priceTree.delete(level.price);
        this.priceMap.delete(level.price);
        this.emptyLevelCount--;
    }

    private maybeCleanup(): void {
        if (this.priceMap.size > 0 && this.emptyLevelCount > this.priceMap.size * 0.2) {
            for (const [price, level] of this.priceMap) {
                if (level.isEmpty()) {
                    this.priceTree.delete(price);
                    this.priceMap.delete(price);
                }
            }
            this.emptyLevelCount = 0;
        }
    }
}

export class OrderBookPair {
    private bids: OrderBookSide;
    private asks: OrderBookSide;

    constructor(readonly marketId: string) {
        this.bids = new OrderBookSide(marketId, "BUY");
        this.asks = new OrderBookSide(marketId, "SELL");
    }

    add(order: BookOrder): void {
        if (order.side === "BUY") this.bids.add(order);
        else this.asks.add(order);
    }

    remove(orderId: string, side: "BUY" | "SELL"): void {
        if (side === "BUY") this.bids.remove(orderId);
        else this.asks.remove(orderId);
    }

    match(incoming: BookOrder): MatchResult[] {
        const priceKey = priceToBigint(incoming.price);
        if (incoming.side === "BUY") {
            return this.asks.match(priceKey, incoming.remainingQty, true);
        } else {
            return this.bids.match(priceKey, incoming.remainingQty, false);
        }
    }

    applyMatches(matches: MatchResult[], takerSide: "BUY" | "SELL"): void {
        if (takerSide === "BUY") this.asks.applyMatches(matches);
        else this.bids.applyMatches(matches);
    }

    wouldMatch(order: BookOrder): boolean {
        if (order.side === "BUY") {
            const bestAsk = this.asks.bestPrice();
            if (!bestAsk) return false;
            return bestAsk.lte(order.price);
        } else {
            const bestBid = this.bids.bestPrice();
            if (!bestBid) return false;
            return bestBid.gte(order.price);
        }
    }
}
