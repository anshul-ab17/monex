import { liquidationService } from "../services/liquidation/liquidation.service";

const LIQUIDATION_INTERVAL_MS = 10_000; // 10s

async function runLiquidationCheck() {
    try {
        const results = await liquidationService.checkAndLiquidate();
        if (results.length > 0) {
            console.log(`[liquidation] liquidated ${results.length} positions`);
            for (const r of results) {
                console.log(`  - ${r.side} ${r.marketId} user=${r.userId} qty=${r.closedQty} loss=${r.realizedLoss}`);
            }
        }
    } catch (err) {
        console.error("[liquidation] check error:", err);
    }
}

export function startLiquidationJob() {
    runLiquidationCheck();
    setInterval(runLiquidationCheck, LIQUIDATION_INTERVAL_MS);
}
