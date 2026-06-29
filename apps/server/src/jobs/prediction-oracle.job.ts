import Decimal from "decimal.js";
import db from "@repo/db";
import { oracleService } from "../services/oracle/oracle.service";
import { predictionService } from "../services/market/prediction.service";

const CHECK_INTERVAL_MS = 30_000; // 30s

// Auto-resolve prediction markets that have oracle-based resolution criteria
// Markets with symbol pattern "PREDICT-<BASE>-ABOVE-<PRICE>" or "PREDICT-<BASE>-BELOW-<PRICE>"
async function checkOracleResolutions() {
    const activeMarkets = await db.market.findMany({
        where: {
            type: "PREDICTION",
            isActive: true,
            resolvedAt: null,
            resolvesAt: { lte: new Date() },
        },
        include: { outcomes: true },
    });

    for (const market of activeMarkets) {
        // Parse resolution criteria from symbol: PREDICT-SOL-ABOVE-200
        const match = market.symbol.match(/^PREDICT-(\w+)-(ABOVE|BELOW)-(\d+(?:\.\d+)?)$/i);
        if (!match) continue; // not oracle-resolvable, skip

        const [, base, direction, targetStr] = match;
        const target = new Decimal(targetStr!);

        const price = await oracleService.getPrice(`${base}/USD`);
        if (!price) continue;

        const conditionMet =
            (direction!.toUpperCase() === "ABOVE" && price.gte(target)) ||
            (direction!.toUpperCase() === "BELOW" && price.lte(target));

        // Find YES/NO outcomes
        const yesOutcome = market.outcomes.find(
            (o: { name: string; id: string }) => o.name.toUpperCase() === "YES",
        );
        const noOutcome = market.outcomes.find(
            (o: { name: string; id: string }) => o.name.toUpperCase() === "NO",
        );

        if (!yesOutcome || !noOutcome) continue;

        const winnerId = conditionMet ? yesOutcome.id : noOutcome.id;

        try {
            await predictionService.resolve(market.id, winnerId);
            console.log(
                `[prediction-oracle] auto-resolved ${market.symbol}: ` +
                `${base}/USD=${price}, ${direction} ${target} → ${conditionMet ? "YES" : "NO"}`,
            );
        } catch (err) {
            console.error(`[prediction-oracle] failed to resolve ${market.symbol}:`, err);
        }
    }
}

export function startPredictionOracleJob() {
    checkOracleResolutions().catch((err) => console.error("[prediction-oracle] error:", err));
    setInterval(() => {
        checkOracleResolutions().catch((err) => console.error("[prediction-oracle] error:", err));
    }, CHECK_INTERVAL_MS);
}
