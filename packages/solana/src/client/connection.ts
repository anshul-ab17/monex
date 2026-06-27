import { Connection } from "@solana/web3.js";
import { env } from "@repo/config";

export const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");