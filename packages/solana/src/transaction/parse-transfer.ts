import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type { TransferInfo } from "../types/transfer";

export function parseTransfer(
    tx: ParsedTransactionWithMeta,
): TransferInfo | null {
    const signature =
        tx.transaction.signatures[0];

    if (!signature) {
        return null;
    }

    for (const instruction of tx.transaction.message.instructions) {
        if (!("parsed" in instruction)) {
            continue;
        }

        if (
            instruction.program !== "system"
        ) {
            continue;
        }

        const parsed = instruction.parsed;

        if (
            parsed.type !== "transfer"
        ) {
            continue;
        }

        const info = parsed.info;

        if (
            !info.source ||
            !info.destination
        ) {
            continue;
        }

        return {
            sender: info.source,
            recipient: info.destination,
            amount: info.lamports.toString(),
            assetId: "SOL",
            signature,
            slot: tx.slot,
        };
    }

    return null;
}