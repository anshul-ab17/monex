import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export function getMasterWallet() {
    const secret = process.env.SOLANA_MASTER_SECRET;
    if (!secret) throw new Error("SOLANA_MASTER_SECRET env var not set");
    return Keypair.fromSecretKey(bs58.decode(secret));
}