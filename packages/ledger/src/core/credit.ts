import { randomUUID } from "crypto";

import { EntryType } from "../constants/entry-types";

import type {
  LedgerEntry,
} from "../types/ledger-entry";

export interface CreditInput {
  journalId: string;

  accountId: string;

  amount: string;
}

export function credit(
  input: CreditInput,
): LedgerEntry {
  return {
    id: randomUUID(),

    journalId: input.journalId,

    accountId: input.accountId,

    type: EntryType.CREDIT,

    amount: input.amount,
  };
}