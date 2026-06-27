import type db from "@repo/db";

type Tx = Parameters<Parameters<(typeof db)["$transaction"]>[0]>[0];

// Mirrors the Prisma LedgerReferenceType enum values
type ReferenceType = "DEPOSIT" | "WITHDRAWAL" | "TRADE" | "FEE" | "ADJUSTMENT";

export interface EntryInput {
    accountId: string;
    // positive = credit, negative = debit
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
