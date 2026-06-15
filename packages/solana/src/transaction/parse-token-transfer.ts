import {
  ParsedTransactionWithMeta,
} from "@solana/web3.js";

import type {
  TransferInfo,
} from "../types/transfer";

export function parseTokenTransfer(
  tx: ParsedTransactionWithMeta,
): TransferInfo | null {
  const instructions =
    tx.transaction.message.instructions;

  for (const instruction of instructions) {
    if (
      instruction.program !== "spl-token"
    ) {
      continue;
    }

    const parsed =
      "parsed" in instruction
        ? instruction.parsed
        : null;

    if (
      !parsed ||
      parsed.type !== "transferChecked"
    ) {
      continue;
    }

    const info = parsed.info;

    return {
      sender: info.source,

      recipient: info.destination,

      amount: info.tokenAmount.amount,

      assetId: info.mint,

      signature:
        tx.transaction.signatures[0],

      slot: tx.slot,
    };
  }

  return null;
}