import { PublicKey } from "@solana/web3.js"
import {getAssociatedTokenAddress } from "@solana/spl-token"
import { connection } from "../client/connection";


export async function getTokenBalance(
    wallet: string,
    mint : string,
) {
    const ata = await getAssociatedTokenAddress(
        new PublicKey(mint),
        new PublicKey(wallet)
    );

    return connection.getTokenAccountBalance(
        ata,
    )
}