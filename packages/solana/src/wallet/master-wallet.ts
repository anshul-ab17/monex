import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export function getMasterWallet() {
    return Keypair.fromSecretKey(
        bs58.decode(
        process.env.SOLANA_MASTER_SECRET!,
        ),
    );
}