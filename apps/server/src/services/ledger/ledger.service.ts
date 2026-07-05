import db from "@repo/db";
import Decimal from "decimal.js";
import { InsufficientBalanceError } from "../../utils/errors";
import { AccountType } from "@repo/ledger";
import {
    getUserAccount,
    getOrCreateUserAccount,
    getOrCreateSystemAccount,
} from "./ledger.repository";
import { createJournal } from "./journal.service";

type DB = typeof db;

export class LedgerService {
    private db: DB;
    constructor(injectedDb?: DB) {
        this.db = injectedDb ?? db;
    }

    async credit(
        userId: string,
        assetId: string,
        amount: Decimal,
        referenceId: string,
        referenceType: "DEPOSIT" | "ADJUSTMENT" = "DEPOSIT",
    ) {
        await this.db.$transaction(async (tx) => {
            const account = await getUserAccount(tx, userId, assetId);
            await createJournal(tx, referenceType, referenceId, [
                { accountId: account.id, amount: amount.toString(), description: "CREDIT" },
            ]);
            await tx.balance.upsert({
                where: { userId_assetId: { userId, assetId } },
                create: { userId, assetId, available: amount.toString(), locked: "0" },
                update: { available: { increment: amount.toString() } },
            });
        });
    }

    async debit(
        userId: string,
        assetId: string,
        amount: Decimal,
        referenceId: string,
        referenceType: "WITHDRAWAL" | "ADJUSTMENT" = "WITHDRAWAL",
    ) {
        await this.db.$transaction(async (tx) => {
            const balance = await tx.balance.findUnique({
                where: { userId_assetId: { userId, assetId } },
            });
            if (!balance || new Decimal(balance.available.toString()).lt(amount)) {
                throw new InsufficientBalanceError();
            }
            const account = await getUserAccount(tx, userId, assetId);
            await createJournal(tx, referenceType, referenceId, [
                { accountId: account.id, amount: amount.negated().toString(), description: "DEBIT" },
            ]);
            await tx.balance.update({
                where: { userId_assetId: { userId, assetId } },
                data: { available: { decrement: amount.toString() } },
            });
        });
    }

    // Move available → locked (order placement)
    async reserve(
        userId: string,
        assetId: string,
        amount: Decimal,
        referenceId: string,
    ) {
        await this.db.$transaction(async (tx) => {
            const balance = await tx.balance.findUnique({
                where: { userId_assetId: { userId, assetId } },
            });
            if (!balance || new Decimal(balance.available.toString()).lt(amount)) {
                throw new InsufficientBalanceError();
            }
            await tx.balance.update({
                where: { userId_assetId: { userId, assetId } },
                data: {
                    available: { decrement: amount.toString() },
                    locked: { increment: amount.toString() },
                },
            });
        });
    }

    // Move locked → available (order cancel)
    async release(
        userId: string,
        assetId: string,
        amount: Decimal,
        referenceId: string,
    ) {
        await this.db.$transaction(async (tx) => {
            const balance = await tx.balance.findUnique({
                where: { userId_assetId: { userId, assetId } },
            });
            if (!balance || new Decimal(balance.locked.toString()).lt(amount)) {
                throw new InsufficientBalanceError();
            }
            await tx.balance.update({
                where: { userId_assetId: { userId, assetId } },
                data: {
                    locked: { decrement: amount.toString() },
                    available: { increment: amount.toString() },
                },
            });
        });
    }

    async settleTrade(input: {
        tradeId: string;
        buyerId: string;
        sellerId: string;
        baseAssetId: string;
        quoteAssetId: string;
        quantity: Decimal;
        price: Decimal;
        makerFee: Decimal;
        takerFee: Decimal;
        takerSide: string;
    }) {
        const { tradeId, buyerId, sellerId, baseAssetId, quoteAssetId, quantity, price, makerFee, takerFee, takerSide } =
            input;
        const totalQuote = price.mul(quantity);

        const buyerFee = takerSide === "BUY" ? takerFee : makerFee;
        const sellerFee = takerSide === "SELL" ? takerFee : makerFee;
        const sellerReceives = totalQuote.sub(sellerFee);
        const totalFee = makerFee.add(takerFee);

        await this.db.$transaction(async (tx) => {
            const [buyerBase, buyerQuote, sellerBase, sellerQuote, feesAccount] = await Promise.all([
                getOrCreateUserAccount(tx, buyerId, baseAssetId),
                getUserAccount(tx, buyerId, quoteAssetId),
                getUserAccount(tx, sellerId, baseAssetId),
                getOrCreateUserAccount(tx, sellerId, quoteAssetId),
                getOrCreateSystemAccount(tx, quoteAssetId, "FEES"),
            ]);

            await createJournal(tx, "TRADE", tradeId, [
                { accountId: buyerQuote.id, amount: totalQuote.negated().toString(), description: "BUYER_PAYS_QUOTE" },
                { accountId: buyerBase.id, amount: quantity.sub(buyerFee).toString(), description: "BUYER_RECEIVES_BASE_MINUS_FEE" },
                { accountId: sellerBase.id, amount: quantity.negated().toString(), description: "SELLER_PAYS_BASE" },
                { accountId: sellerQuote.id, amount: sellerReceives.toString(), description: "SELLER_RECEIVES_QUOTE_MINUS_FEE" },
                { accountId: feesAccount.id, amount: totalFee.toString(), description: "FEES_COLLECTED" },
            ]);

            await Promise.all([
                tx.balance.update({
                    where: { userId_assetId: { userId: buyerId, assetId: quoteAssetId } },
                    data: { locked: { decrement: totalQuote.toString() } },
                }),
                tx.balance.upsert({
                    where: { userId_assetId: { userId: buyerId, assetId: baseAssetId } },
                    create: { userId: buyerId, assetId: baseAssetId, available: quantity.toString(), locked: "0" },
                    update: { available: { increment: quantity.toString() } },
                }),
                tx.balance.update({
                    where: { userId_assetId: { userId: sellerId, assetId: baseAssetId } },
                    data: { locked: { decrement: quantity.toString() } },
                }),
                tx.balance.upsert({
                    where: { userId_assetId: { userId: sellerId, assetId: quoteAssetId } },
                    create: { userId: sellerId, assetId: quoteAssetId, available: sellerReceives.toString(), locked: "0" },
                    update: { available: { increment: sellerReceives.toString() } },
                }),
            ]);
        });
    }

    // Called when a user registers — creates a LedgerAccount + Balance row per asset
    async initUserAccounts(userId: string, assetIds: string[]) {
        // Idempotent for Kafka at-least-once replay: skip assets that already
        // have a USER account (safe because USER_REGISTERED is keyed by userId
        // → single partition, processed sequentially, no concurrent replay).
        // ponytail: existence filter; add @@unique([userId,assetId,type]) + upsert if replay ever becomes concurrent.
        const existing = await this.db.ledgerAccount.findMany({
            where: { userId, type: "USER" },
            select: { assetId: true },
        });
        const existingAssetIds = new Set(existing.map((a) => a.assetId));
        const newAssetIds = assetIds.filter((id) => !existingAssetIds.has(id));

        await this.db.$transaction(
            newAssetIds.flatMap((assetId) => [
                this.db.ledgerAccount.create({
                    data: { userId, assetId, type: "USER" },
                }),
                this.db.balance.upsert({
                    where: { userId_assetId: { userId, assetId } },
                    create: { userId, assetId, available: "0", locked: "0" },
                    update: {},
                }),
            ]),
        );
    }
}

export const ledgerService = new LedgerService();
