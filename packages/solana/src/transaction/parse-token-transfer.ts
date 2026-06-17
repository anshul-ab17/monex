import type { ParsedTransactionWithMeta }
  from "@solana/web3.js";

import type { TransferInfo }
  from "../types/transfer";

export function parseTokenTransfer(
  tx: ParsedTransactionWithMeta,
): TransferInfo | null {
  for (
    const instruction
    of tx.transaction.message.instructions
  ) {
    if (
      instruction.program !==
      "spl-token"
    ) {
      continue;
    }

    const parsed =
      "parsed" in instruction
        ? instruction.parsed
        : null;

    if (
      !parsed ||
      parsed.type !==
        "transferChecked"
    ) {
      continue;
    }

    return {
      sender:
        parsed.info.source,

      recipient:
        parsed.info.destination,

      amount:
        parsed.info.tokenAmount.amount,

      assetId:
        parsed.info.mint,

      signature:tx.transaction.signatures[0],

      slot: tx.slot,
    };
  }

  return null;
}