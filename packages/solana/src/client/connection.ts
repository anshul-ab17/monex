import { Connection } from "@solana/web3.js";
import { env } from "@repo/config";

const FALLBACK_RPCS = [
    "https://api.devnet.solana.com",
    "https://rpc.ankr.com/solana_devnet",
];

let primaryConnection = new Connection(env.SOLANA_RPC_URL, "confirmed");
let failCount = 0;
let circuitOpen = false;
let circuitOpenedAt = 0;

const FAILURE_THRESHOLD = 3;
const RECOVERY_MS = 30_000;

function getFallbackConnection(): Connection {
    const url = FALLBACK_RPCS[Math.floor(Math.random() * FALLBACK_RPCS.length)]!;
    return new Connection(url, "confirmed");
}

export async function withRetry<T>(
    fn: (conn: Connection) => Promise<T>,
    maxRetries = 2,
): Promise<T> {
    if (circuitOpen && Date.now() - circuitOpenedAt > RECOVERY_MS) {
        circuitOpen = false;
        failCount = 0;
    }

    const conn = circuitOpen ? getFallbackConnection() : primaryConnection;

    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await fn(conn);
            if (!circuitOpen) failCount = 0;
            return result;
        } catch (err) {
            lastError = err;
            if (!circuitOpen) {
                failCount++;
                if (failCount >= FAILURE_THRESHOLD) {
                    circuitOpen = true;
                    circuitOpenedAt = Date.now();
                }
            }
            if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
            }
        }
    }

    throw lastError;
}

export const connection = primaryConnection;
