import { PublicKey } from "@solana/web3.js";

export function validateAddress(address: string,) {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}