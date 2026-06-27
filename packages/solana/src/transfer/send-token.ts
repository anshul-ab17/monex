import { Keypair, PublicKey } from "@solana/web3.js";
import { transfer, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import Decimal from "decimal.js";
import { connection } from "../client/connection";

export async function sendToken(
    from: Keypair,
    toAddress: string,
    mintAddress: string,
    amount: Decimal,
    decimals: number,
): Promise<string> {
    const mint = new PublicKey(mintAddress);
    const recipient = new PublicKey(toAddress);
    const fromATA = await getOrCreateAssociatedTokenAccount(connection, from, mint, from.publicKey);
    const toATA = await getOrCreateAssociatedTokenAccount(connection, from, mint, recipient);
    const rawAmount = BigInt(amount.mul(new Decimal(10).pow(decimals)).toFixed(0));
    return transfer(connection, from, fromATA.address, toATA.address, from, rawAmount);
}
