import { PublicKey } from "@solana/web3.js";
import { connection } from "../client/connection";

export async function getSignaturesForAddress(
    address: string,
    options: { until?: string; limit?: number } = {},
) {
    return connection.getSignaturesForAddress(new PublicKey(address), {
        until: options.until,
        limit: options.limit ?? 100,
    });
}
