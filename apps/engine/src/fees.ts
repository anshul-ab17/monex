import Decimal from "decimal.js";

export interface FeeSchedule {
    makerFee: Decimal;
    takerFee: Decimal;
}

export interface FeeResult {
    makerFee: Decimal;
    takerFee: Decimal;
    totalFee: Decimal;
}

export function calculateFees(
    price: Decimal,
    quantity: Decimal,
    schedule: FeeSchedule,
): FeeResult {
    const notional = price.mul(quantity);
    const makerFee = notional.mul(schedule.makerFee);
    const takerFee = notional.mul(schedule.takerFee);
    return { makerFee, takerFee, totalFee: makerFee.add(takerFee) };
}
