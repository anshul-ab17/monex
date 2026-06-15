import { PublicKey } from "@solana/web3.js";
import { connection } from "../client/connection";

export async function getSolBalance(
    address: string
) {
    return connection.getBalance(
        new PublicKey(address)
    );
}