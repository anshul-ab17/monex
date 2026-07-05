import Decimal from "decimal.js";

export const normalizeAmount = (amount: string, decimals: number) =>
    new Decimal(amount).div(new Decimal(10).pow(decimals)).toString();
