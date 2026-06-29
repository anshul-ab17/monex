import Decimal from "decimal.js";
import db from "@repo/db";
import { tickerService } from "../market/ticker.service";

interface PositionPnl {
    marketId: string;
    symbol: string;
    side: string;
    quantity: string;
    avgEntryPrice: string;
    currentPrice: string;
    unrealizedPnl: string;
    realizedPnl: string;
}

interface PortfolioSummary {
    positions: PositionPnl[];
    totalUnrealizedPnl: string;
    totalRealizedPnl: string;
}

export const portfolioService = {
    async getPortfolio(userId: string): Promise<PortfolioSummary> {
        const positions = await db.position.findMany({
            where: { userId },
            include: { market: { select: { symbol: true } } },
        });

        let totalUnrealized = new Decimal(0);
        let totalRealized = new Decimal(0);

        const positionPnls: PositionPnl[] = [];

        for (const pos of positions) {
            const qty = new Decimal(pos.quantity.toString());
            if (qty.isZero()) continue;

            const avgEntry = new Decimal(pos.avgEntryPrice.toString());
            const realized = new Decimal(pos.realizedPnl.toString());
            totalRealized = totalRealized.add(realized);

            const ticker = await tickerService.getTicker(pos.marketId);
            const currentPrice = ticker ? new Decimal(ticker.lastPrice) : avgEntry;

            const diff = currentPrice.sub(avgEntry);
            const unrealized = pos.side === "LONG" ? diff.mul(qty) : diff.neg().mul(qty);
            totalUnrealized = totalUnrealized.add(unrealized);

            positionPnls.push({
                marketId: pos.marketId,
                symbol: pos.market.symbol,
                side: pos.side,
                quantity: qty.toString(),
                avgEntryPrice: avgEntry.toString(),
                currentPrice: currentPrice.toString(),
                unrealizedPnl: unrealized.toString(),
                realizedPnl: realized.toString(),
            });
        }

        return {
            positions: positionPnls,
            totalUnrealizedPnl: totalUnrealized.toString(),
            totalRealizedPnl: totalRealized.toString(),
        };
    },
};
