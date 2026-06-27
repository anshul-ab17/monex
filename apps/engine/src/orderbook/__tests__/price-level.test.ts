import { describe, test, expect } from "bun:test";
import Decimal from "decimal.js";
import { PriceLevel } from "../price-level";
import { OrderNode, priceToBigint } from "../order-node";

function makeNode(id: string, qty: string, seq: number): OrderNode {
    const price = priceToBigint(new Decimal("100"));
    return new OrderNode({
        orderId: id,
        userId: "u1",
        marketId: "m1",
        side: "BUY",
        remainingQty: new Decimal(qty),
        sequenceNumber: BigInt(seq),
        timeInForce: "GTC",
        postOnly: false,
        price,
        decimalPrice: new Decimal("100"),
    });
}

describe("PriceLevel", () => {
    test("starts empty", () => {
        const level = new PriceLevel(100_000000n);
        expect(level.isEmpty()).toBe(true);
        expect(level.orderCount).toBe(0);
        expect(level.totalQty.isZero()).toBe(true);
        expect(level.head).toBeNull();
        expect(level.tail).toBeNull();
    });

    test("append single node", () => {
        const level = new PriceLevel(100_000000n);
        const n = makeNode("o1", "10", 1);
        level.append(n);
        expect(level.head).toBe(n);
        expect(level.tail).toBe(n);
        expect(level.orderCount).toBe(1);
        expect(level.totalQty.eq(new Decimal("10"))).toBe(true);
        expect(n.priceLevel).toBe(level);
        expect(n.prev).toBeNull();
        expect(n.next).toBeNull();
    });

    test("append preserves FIFO order", () => {
        const level = new PriceLevel(100_000000n);
        const a = makeNode("o1", "10", 1);
        const b = makeNode("o2", "20", 2);
        const c = makeNode("o3", "5", 3);
        level.append(a);
        level.append(b);
        level.append(c);
        expect(level.head).toBe(a);
        expect(level.tail).toBe(c);
        expect(a.next).toBe(b);
        expect(b.next).toBe(c);
        expect(c.prev).toBe(b);
        expect(b.prev).toBe(a);
        expect(level.orderCount).toBe(3);
        expect(level.totalQty.eq(new Decimal("35"))).toBe(true);
    });

    test("remove head", () => {
        const level = new PriceLevel(100_000000n);
        const a = makeNode("o1", "10", 1);
        const b = makeNode("o2", "20", 2);
        level.append(a);
        level.append(b);
        level.remove(a);
        expect(level.head).toBe(b);
        expect(b.prev).toBeNull();
        expect(level.orderCount).toBe(1);
        expect(level.totalQty.eq(new Decimal("20"))).toBe(true);
        expect(a.prev).toBeNull();
        expect(a.next).toBeNull();
        expect(a.priceLevel).toBeNull();
    });

    test("remove tail", () => {
        const level = new PriceLevel(100_000000n);
        const a = makeNode("o1", "10", 1);
        const b = makeNode("o2", "20", 2);
        level.append(a);
        level.append(b);
        level.remove(b);
        expect(level.tail).toBe(a);
        expect(a.next).toBeNull();
        expect(level.orderCount).toBe(1);
    });

    test("remove middle node", () => {
        const level = new PriceLevel(100_000000n);
        const a = makeNode("o1", "10", 1);
        const b = makeNode("o2", "20", 2);
        const c = makeNode("o3", "5", 3);
        level.append(a);
        level.append(b);
        level.append(c);
        level.remove(b);
        expect(a.next).toBe(c);
        expect(c.prev).toBe(a);
        expect(level.orderCount).toBe(2);
        expect(level.totalQty.eq(new Decimal("15"))).toBe(true);
    });

    test("remove last node makes level empty", () => {
        const level = new PriceLevel(100_000000n);
        const a = makeNode("o1", "10", 1);
        level.append(a);
        level.remove(a);
        expect(level.isEmpty()).toBe(true);
        expect(level.head).toBeNull();
        expect(level.tail).toBeNull();
    });
});
