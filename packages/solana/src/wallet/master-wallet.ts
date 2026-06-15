import { Keypair } from "@solana/web3.js";

import bs58 from "bs58";

export function getMasterWallet() {

    const secret = process.env.SOLANA_MASTER_SECRET!;

    return Keypair.fromSecretKey(
        bs58.decode(secret),
    );
}