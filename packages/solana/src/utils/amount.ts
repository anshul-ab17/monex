import Decimal from "decimal.js";

export const addAmounts = (
    a: string,
    b: string,
) =>
    new Decimal(a)
        .plus(b)
        .toString();

export const subtractAmounts = (
    a: string,
    b: string,
) =>
    new Decimal(a)
        .minus(b)
        .toString();

export const multiplyAmounts = (
    a: string,
    b: string,
) =>
    new Decimal(a)
        .mul(b)
        .toString();

export const divideAmounts = (
    a: string,
    b: string,
) =>
    new Decimal(a)
        .div(b)
        .toString();

export const isZero = (
    amount: string,
) =>
    new Decimal(amount).eq(0);

export const normalizeAmount = (
    amount: string,
    decimals: number,
) =>
    new Decimal(amount)
        .div(
            new Decimal(10).pow(
                decimals,
            ),
        )
        .toString();