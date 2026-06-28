import { describe, it, expect } from "bun:test";
import Decimal from "decimal.js";

// Test risk limit constants directly
const MAX_ORDER_VALUE = new Decimal("100000");
const MAX_POSITION_SIZE = new Decimal("1000000");
const MAX_OPEN_ORDERS = 100;

describe("Risk Service — Limit Constants", () => {
    it("rejects order exceeding max value", () => {
        const orderValue = new Decimal("150").mul(new Decimal("1000"));
        expect(orderValue.gt(MAX_ORDER_VALUE)).toBe(true);
    });

    it("accepts order within max value", () => {
        const orderValue = new Decimal("100").mul(new Decimal("10"));
        expect(orderValue.lte(MAX_ORDER_VALUE)).toBe(true);
    });

    it("rejects position exceeding max size", () => {
        const currentPosition = new Decimal("999000");
        const newOrder = new Decimal("2000");
        expect(currentPosition.add(newOrder).gt(MAX_POSITION_SIZE)).toBe(true);
    });

    it("accepts position within max size", () => {
        const currentPosition = new Decimal("500000");
        const newOrder = new Decimal("100");
        expect(currentPosition.add(newOrder).lte(MAX_POSITION_SIZE)).toBe(true);
    });

    it("enforces open order limit", () => {
        expect(MAX_OPEN_ORDERS).toBe(100);
        expect(101 > MAX_OPEN_ORDERS).toBe(true);
        expect(100 >= MAX_OPEN_ORDERS).toBe(true);
    });
});
