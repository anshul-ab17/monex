import Decimal from "decimal.js";

export function addAmounts(
  a: string,
  b: string,
): string {
  return new Decimal(a)
    .plus(b)
    .toString();
}

export function subtractAmounts(
  a: string,
  b: string,
): string {
  return new Decimal(a)
    .minus(b)
    .toString();
}

export function multiplyAmounts(
  a: string,
  b: string,
): string {
  return new Decimal(a)
    .mul(b)
    .toString();
}

export function divideAmounts(
  a: string,
  b: string,
): string {
  return new Decimal(a)
    .div(b)
    .toString();
}

export function isGreaterThan(
  a: string,
  b: string,
): boolean {
  return new Decimal(a).gt(b);
}

export function isGreaterThanOrEqual(
  a: string,
  b: string,
): boolean {
  return new Decimal(a).gte(b);
}

export function isLessThan(
  a: string,
  b: string,
): boolean {
  return new Decimal(a).lt(b);
}

export function isZero(amount: string ): boolean {
  return new Decimal(amount).eq(0);
}