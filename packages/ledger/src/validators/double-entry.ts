import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type { TransferInfo } from "../types/transfer";

export function parseTokenTransfer(
    tx: ParsedTransactionWithMeta,
): TransferInfo | null {
    const instructions =
        tx.transaction.message.instructions;

    for (const instruction of instructions) {
        if (!("parsed" in instruction)) {
            continue;
        }

        if (
            instruction.program !==
            "spl-token"
        ) {
            continue;
        }

        const parsed =
            instruction.parsed;

        if (
            parsed.type !==
            "transferChecked"
        ) {
            continue;
        }

        const info = parsed.info;

        const signature =
            tx.transaction.signatures[0];

        if (!signature) {
            return null;
        }

        if (
            !info.source ||
            !info.destination ||
            !info.mint
        ) {
            return null;
        }

        return {
            sender: info.source,

            recipient:
                info.destination,

            amount:
                info.tokenAmount.amount,

            assetId:
                info.mint,

            signature,

            slot: tx.slot,
        };
    }

    return null;
}