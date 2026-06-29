import Decimal from "decimal.js";
import db from "@repo/db";
import { redis } from "@repo/redis";
import { RedisKeys } from "@repo/redis";
import {
    getMasterWallet,
    deriveTokenAccount,
    getSignaturesForAddress,
    getTransaction,
    parseTransfer,
    parseTokenTransfer,
    normalizeAmount,
} from "@repo/solana";
import { ledgerService } from "../services/ledger/ledger.service";

const POLL_INTERVAL_MS = 30_000;

async function pollDeposits() {
    const masterWallet = getMasterWallet();
    const masterAddress = masterWallet.publicKey.toBase58();

    const cursor = await redis.get(RedisKeys.depositCursor());
    const sigs = await getSignaturesForAddress(masterAddress, {
        until: cursor ?? undefined,
        limit: 50,
    });

    if (sigs.length === 0) return;

    // Process oldest-first so cursor always advances forward
    for (const sigInfo of [...sigs].reverse()) {
        if (sigInfo.err) continue;

        const existing = await db.deposit.findUnique({ where: { txHash: sigInfo.signature } });
        if (existing) continue;

        const tx = await getTransaction(sigInfo.signature);
        if (!tx) continue;

        // Fee payer = user's wallet (first account key)
        const feePayerKey = tx.transaction.message.accountKeys[0];
        if (!feePayerKey) continue;
        const senderAddress = feePayerKey.pubkey.toBase58();

        const user = await db.user.findFirst({ where: { walletAddress: senderAddress } });
        if (!user) continue; // tx not from a registered user

        let assetId: string | null = null;
        let normalizedAmount: Decimal | null = null;

        const solTransfer = parseTransfer(tx);
        if (solTransfer && solTransfer.recipient === masterAddress) {
            const solAsset = await db.asset.findFirst({ where: { isNative: true } });
            if (!solAsset) continue;
            assetId = solAsset.id;
            normalizedAmount = new Decimal(normalizeAmount(solTransfer.amount, solAsset.decimals));
        } else {
            const splTransfer = parseTokenTransfer(tx);
            if (!splTransfer) continue;

            const splAsset = await db.asset.findFirst({ where: { mintAddress: splTransfer.assetId } });
            if (!splAsset) continue;

            const ata = await deriveTokenAccount(masterAddress, splAsset.mintAddress!);
            if (splTransfer.recipient !== ata.toBase58()) continue;

            assetId = splAsset.id;
            normalizedAmount = new Decimal(normalizeAmount(splTransfer.amount, splAsset.decimals));
        }

        if (!assetId || !normalizedAmount || normalizedAmount.lte(0)) continue;

        const deposit = await db.deposit.create({
            data: {
                userId: user.id,
                assetId,
                txHash: sigInfo.signature,
                amount: normalizedAmount.toString(),
                status: "CONFIRMED",
            },
        });

        await ledgerService.credit(user.id, assetId, normalizedAmount, deposit.id, "DEPOSIT");
        console.log(`[deposit-poller] credited ${normalizedAmount} to ${user.id} (tx: ${sigInfo.signature})`);
    }

    // Advance cursor to newest sig processed
    await redis.set(RedisKeys.depositCursor(), sigs[0]!.signature);
}

export function startDepositPoller() {
    pollDeposits().catch((err) => console.error("[deposit-poller] error:", err));
    setInterval(() => {
        pollDeposits().catch((err) => console.error("[deposit-poller] error:", err));
    }, POLL_INTERVAL_MS);
}
