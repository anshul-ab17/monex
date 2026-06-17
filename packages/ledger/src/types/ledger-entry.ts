import type { EntryType } from "../constants";

export interface LedgerEntry {
    id: string;
    journalId: string;
    accountId: string;
    type: EntryType;
    amount: string;
}