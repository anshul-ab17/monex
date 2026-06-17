import { randomUUID } from "crypto";
import { EntryType } from "../constants/entry-types";
import type {LedgerEntry} from "../types/ledger-entry";

export interface DebitInput {
    journalId: string;
    accountId: string;
    amount: string;
}

export function debit(
  input: DebitInput,
): LedgerEntry {
  return {
    id: randomUUID(),
    journalId: input.journalId,
    accountId: input.accountId,
    type: EntryType.DEBIT,
    amount: input.amount,
  };
}