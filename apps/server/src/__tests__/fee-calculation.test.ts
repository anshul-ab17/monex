import { describe, it, expect } from "bun:test";
import Decimal from "decimal.js";

// Inline fee calc to test without engine dependency
function calculateFees(
    price: Decimal,
    quantity: Decimal,
    schedule: { makerFee: Decimal; takerFee: Decimal },
) {
    const notional = price.mul(quantity);
    const makerFee = notional.mul(schedule.makerFee);
    const takerFee = notional.mul(schedule.takerFee);
    return { makerFee, takerFee, totalFee: makerFee.add(takerFee) };
}

describe("Fee Calculation", () => {
    const schedule = {
        makerFee: new Decimal("0.001"),
        takerFee: new Decimal("0.002"),
    };

    it("calculates fees on standard trade", () => {
        const result = calculateFees(new Decimal("100"), new Decimal("10"), schedule);
        expect(result.makerFee.toString()).toBe("1");
        expect(result.takerFee.toString()).toBe("2");
        expect(result.totalFee.toString()).toBe("3");
    });

    it("handles zero quantity", () => {
        const result = calculateFees(new Decimal("100"), new Decimal("0"), schedule);
        expect(result.totalFee.toString()).toBe("0");
    });

    it("handles high precision", () => {
        const result = calculateFees(
            new Decimal("123.456789"),
            new Decimal("0.00001"),
            schedule,
        );
        expect(result.makerFee.gt(new Decimal("0"))).toBe(true);
        expect(result.totalFee.eq(result.makerFee.add(result.takerFee))).toBe(true);
    });

    it("zero fee schedule returns zero", () => {
        const zeroSchedule = {
            makerFee: new Decimal("0"),
            takerFee: new Decimal("0"),
        };
        const result = calculateFees(new Decimal("1000"), new Decimal("50"), zeroSchedule);
        expect(result.totalFee.toString()).toBe("0");
    });
});
