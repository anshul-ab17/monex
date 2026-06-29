import { Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import Decimal from "decimal.js";
import { connection } from "../client/connection";

export async function sendSol(from: Keypair, toAddress: string, amount: Decimal): Promise<string> {
    const lamports = amount.mul(LAMPORTS_PER_SOL).toNumber();
    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: new PublicKey(toAddress),
            lamports,
        }),
    );
    // sendAndConfirmTransaction needs the raw connection (manages retries internally)
    return sendAndConfirmTransaction(connection, tx, [from]);
}
