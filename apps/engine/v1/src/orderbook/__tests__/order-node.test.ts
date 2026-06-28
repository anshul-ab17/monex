import { describe, test, expect } from "bun:test";
import Decimal from "decimal.js";
import { OrderNode, priceToBigint, bigintToDecimal, PRICE_DECIMALS, PRICE_MULTIPLIER } from "../order-node";

describe("priceToBigint", () => {
    test("converts integer price", () => {
        expect(priceToBigint(new Decimal("100"))).toBe(100_000000n);
    });

    test("converts fractional price", () => {
        expect(priceToBigint(new Decimal("1.23"))).toBe(1_230000n);
    });

    test("converts sub-cent price", () => {
        expect(priceToBigint(new Decimal("0.000001"))).toBe(1n);
    });

    test("converts zero", () => {
        expect(priceToBigint(new Decimal("0"))).toBe(0n);
    });
});

describe("bigintToDecimal", () => {
    test("round-trips with priceToBigint", () => {
        const original = new Decimal("45.123456");
        const bigint = priceToBigint(original);
        const back = bigintToDecimal(bigint);
        expect(back.eq(original)).toBe(true);
    });
});

describe("OrderNode", () => {
    test("constructs with all fields and null pointers", () => {
        const node = new OrderNode({
            orderId: "o1",
            userId: "u1",
            marketId: "m1",
            side: "BUY",
            remainingQty: new Decimal("10"),
            sequenceNumber: 1n,
            timeInForce: "GTC",
            postOnly: false,
            decimalPrice: new Decimal("50"),
            price: priceToBigint(new Decimal("50")),
        });
        expect(node.orderId).toBe("o1");
        expect(node.price).toBe(50_000000n);
        expect(node.prev).toBeNull();
        expect(node.next).toBeNull();
        expect(node.priceLevel).toBeNull();
    });
});
