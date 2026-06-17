import {getAssociatedTokenAddress} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export async function deriveTokenAccount(
  walletAddress: string,
  mintAddress: string,
) {
    return getAssociatedTokenAddress(
        new PublicKey(mintAddress),
        new PublicKey(walletAddress),
    );
}