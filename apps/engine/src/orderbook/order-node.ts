import Decimal from "decimal.js";
import type { PriceLevel } from "./price-level";

export const PRICE_DECIMALS = 6;
export const PRICE_MULTIPLIER = 10n ** BigInt(PRICE_DECIMALS); // 1_000_000n

export function priceToBigint(d: Decimal): bigint {
    return BigInt(d.mul(PRICE_MULTIPLIER.toString()).toFixed(0));
}

export function bigintToDecimal(b: bigint): Decimal {
    return new Decimal(b.toString()).div(PRICE_MULTIPLIER.toString());
}

export interface OrderNodeInit {
    orderId: string;
    userId: string;
    marketId: string;
    side: "BUY" | "SELL";
    remainingQty: Decimal;
    sequenceNumber: bigint;
    timeInForce: string;
    postOnly: boolean;
    price: bigint;
    decimalPrice: Decimal;
}

export class OrderNode {
    readonly orderId: string;
    readonly userId: string;
    readonly marketId: string;
    readonly side: "BUY" | "SELL";
    remainingQty: Decimal;
    readonly sequenceNumber: bigint;
    readonly timeInForce: string;
    readonly postOnly: boolean;
    readonly price: bigint;
    readonly decimalPrice: Decimal;

    // ponytail: intrusive DLL pointers — null until inserted into a PriceLevel
    prev: OrderNode | null = null;
    next: OrderNode | null = null;
    priceLevel: PriceLevel | null = null;

    constructor(init: OrderNodeInit) {
        this.orderId = init.orderId;
        this.userId = init.userId;
        this.marketId = init.marketId;
        this.side = init.side;
        this.remainingQty = init.remainingQty;
        this.sequenceNumber = init.sequenceNumber;
        this.timeInForce = init.timeInForce;
        this.postOnly = init.postOnly;
        this.price = init.price;
        this.decimalPrice = init.decimalPrice;
    }
}
