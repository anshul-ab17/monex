import type db from "@repo/db";
import type { SettleTradeInput, ReserveInput, ReleaseInput } from "@repo/ledger";

type Tx = Parameters<Parameters<(typeof db)["$transaction"]>[0]>[0];

type ReferenceType = "DEPOSIT" | "WITHDRAWAL" | "TRADE" | "FEE" | "ADJUSTMENT";

export type { SettleTradeInput, ReserveInput, ReleaseInput };

export interface EntryInput {
    accountId: string;
    amount: string;
    description?: string;
}

export async function createJournal(
    tx: Tx,
    referenceType: ReferenceType,
    referenceId: string,
    entries: EntryInput[],
    description?: string,
) {
    return tx.ledgerJournal.create({
        data: {
            referenceType,
            referenceId,
            description,
            entries: {
                create: entries.map((e) => ({
                    accountId: e.accountId,
                    amount: e.amount,
                    description: e.description,
                })),
            },
        },
        select: { id: true },
    });
}
