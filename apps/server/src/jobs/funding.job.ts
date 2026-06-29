import db from "@repo/db";
import { fundingService } from "../services/market/funding.service";

const FUNDING_INTERVAL_MS = 8 * 60 * 60 * 1000;

async function runFundingSettlement() {
    // ponytail: only PERP markets get funding, skip if none exist
    const perpMarkets = await db.market.findMany({
        where: { type: "PERPETUAL", isActive: true },
        select: { id: true, symbol: true },
    });

    if (perpMarkets.length === 0) return;

    for (const market of perpMarkets) {
        try {
            const result = await fundingService.settleFunding(market.id);
            console.log(`[funding] ${market.symbol}: rate=${result.rate ?? "0"}, settled=${result.settled}`);
        } catch (err) {
            console.error(`[funding] error settling ${market.symbol}:`, err);
        }
    }
}

export function startFundingJob() {
    // Run once on start (checks if 8h has passed since last settlement)
    runFundingSettlement().catch((err) => console.error("[funding] error:", err));
    setInterval(() => {
        runFundingSettlement().catch((err) => console.error("[funding] error:", err));
    }, FUNDING_INTERVAL_MS);
}
