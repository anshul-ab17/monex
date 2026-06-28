import { describe, it, expect } from "bun:test";
import Decimal from "decimal.js";

describe("Ticker Computation Logic", () => {
    it("calculates 24h change correctly", () => {
        const openPrice = new Decimal("100");
        const lastPrice = new Decimal("110");
        const change = lastPrice.sub(openPrice);
        const changePercent = change.div(openPrice).mul(100);

        expect(change.toString()).toBe("10");
        expect(changePercent.toFixed(2)).toBe("10.00");
    });

    it("handles negative change", () => {
        const openPrice = new Decimal("100");
        const lastPrice = new Decimal("90");
        const change = lastPrice.sub(openPrice);
        const changePercent = change.div(openPrice).mul(100);

        expect(change.toString()).toBe("-10");
        expect(changePercent.toFixed(2)).toBe("-10.00");
    });

    it("handles zero open price gracefully", () => {
        const openPrice = new Decimal("0");
        const lastPrice = new Decimal("50");
        const change = lastPrice.sub(openPrice);
        const changePercent = openPrice.isZero()
            ? new Decimal("0")
            : change.div(openPrice).mul(100);

        expect(changePercent.toString()).toBe("0");
    });

    it("no change when price unchanged", () => {
        const price = new Decimal("150.50");
        const change = price.sub(price);
        expect(change.isZero()).toBe(true);
    });
});
