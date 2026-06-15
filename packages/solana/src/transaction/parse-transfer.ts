import { ParsedTransactionWithMeta,} from "@solana/web3.js";

import type { TransferInfo } from "../types/transfer";

export function parseTransfer(
  tx: ParsedTransactionWithMeta,
): TransferInfo | null {
  const instructions =
    tx.transaction.message.instructions;

  for (const instruction of instructions) {
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

    const info = parsed.info;

    return {
      sender: info.source,

      recipient: info.destination,

      amount: info.lamports.toString(),

      assetId: "SOL",

      signature:
        tx.transaction.signatures[0],

      slot: tx.slot,
    };
  }

  return null;
}