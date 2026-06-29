import Decimal from "decimal.js";
import db from "@repo/db";

interface FeeTier {
    minVolume: Decimal;
    makerFee: Decimal;
    takerFee: Decimal;
}

const TIERS: FeeTier[] = [
    { minVolume: new Decimal("1000000"), makerFee: new Decimal("0.0002"), takerFee: new Decimal("0.0004") },
    { minVolume: new Decimal("500000"), makerFee: new Decimal("0.0004"), takerFee: new Decimal("0.0008") },
    { minVolume: new Decimal("100000"), makerFee: new Decimal("0.0006"), takerFee: new Decimal("0.001") },
    { minVolume: new Decimal("10000"), makerFee: new Decimal("0.0008"), takerFee: new Decimal("0.0015") },
    { minVolume: new Decimal("0"), makerFee: new Decimal("0.001"), takerFee: new Decimal("0.002") },
];

export const feeTierService = {
    async getUserVolume30d(userId: string): Promise<Decimal> {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await db.trade.aggregate({
            where: {
                OR: [{ buyerId: userId }, { sellerId: userId }],
                createdAt: { gte: since },
            },
            _sum: { quantity: true },
        });
        return new Decimal(result._sum.quantity?.toString() ?? "0");
    },

    async getUserFees(userId: string): Promise<{ makerFee: Decimal; takerFee: Decimal }> {
        const volume = await this.getUserVolume30d(userId);
        for (const tier of TIERS) {
            if (volume.gte(tier.minVolume)) {
                return { makerFee: tier.makerFee, takerFee: tier.takerFee };
            }
        }
        const fallback = TIERS[TIERS.length - 1]!;
        return { makerFee: fallback.makerFee, takerFee: fallback.takerFee };
    },

    getTiers() {
        return TIERS.map((t) => ({
            minVolume: t.minVolume.toString(),
            makerFee: t.makerFee.toString(),
            takerFee: t.takerFee.toString(),
        }));
    },
};
