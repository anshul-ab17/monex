import db from "@repo/db";
import Decimal from "decimal.js";

interface PriceLevel {
    price: string;
    quantity: string;
}

export const depthService = {
    async getDepth(marketId: string, levels = 20) {
        const orders = await db.order.findMany({
            where: { marketId, status: { in: ["OPEN", "PARTIALLY_FILLED"] }, type: "LIMIT" },
            select: { side: true, price: true, remainingQty: true },
        });

        const bidsMap = new Map<string, Decimal>();
        const asksMap = new Map<string, Decimal>();

        for (const o of orders) {
            if (!o.price) continue;
            const priceStr = new Decimal(o.price.toString()).toFixed();
            const qty = new Decimal(o.remainingQty.toString());
            const map = o.side === "BUY" ? bidsMap : asksMap;
            map.set(priceStr, (map.get(priceStr) ?? new Decimal(0)).add(qty));
        }

        const toSorted = (map: Map<string, Decimal>, asc: boolean): PriceLevel[] =>
            [...map.entries()]
                .sort((a, b) => (asc ? new Decimal(a[0]).cmp(new Decimal(b[0])) : new Decimal(b[0]).cmp(new Decimal(a[0]))))
                .slice(0, levels)
                .map(([price, quantity]) => ({ price, quantity: quantity.toFixed() }));

        return {
            bids: toSorted(bidsMap, false), // highest first
            asks: toSorted(asksMap, true),  // lowest first
        };
    },
};
