import { ParsedTransactionWithMeta }
  from "@solana/web3.js";

import type { TransferInfo }
  from "../types/transfer";

export function parseTransfer(
  tx: ParsedTransactionWithMeta,
): TransferInfo | null {
  for (
    const instruction
    of tx.transaction.message.instructions
  ) {
    if (
      instruction.program !== "system"
    ) {
      continue;
    }

    const parsed =
      "parsed" in instruction
        ? instruction.parsed
        : null;

    if (
      !parsed ||
      parsed.type !== "transfer"
    ) {
      continue;
    }

    return {
      sender:
        parsed.info.source,

      recipient:
        parsed.info.destination,

      amount:
        parsed.info.lamports.toString(),

      assetId: "SOL",

      signature:
        tx.transaction.signatures[0],

      slot: tx.slot,
    };
  }

  return null;
}