import Decimal from "decimal.js";
import type { LedgerEntry } from "../types/ledger-entry";

import { EntryType } from "../constants/entry-types";

export function validateBalancedJournal(
  entries: LedgerEntry[],
): boolean {
  const debitTotal = entries
    .filter(
      (entry) =>
        entry.type === EntryType.DEBIT,
    )
    .reduce(
      (sum, entry) =>
        sum.plus(entry.amount),
      new Decimal(0),
    );

  const creditTotal = entries
    .filter(
      (entry) =>
        entry.type === EntryType.CREDIT,
    )
    .reduce(
      (sum, entry) =>
        sum.plus(entry.amount),
      new Decimal(0),
    );

  return debitTotal.equals(
    creditTotal,
  );
}