import { getTransaction } from "../transaction/get-transaction";

export async function verifyDeposit( txHash: string) {
    const tx = await getTransaction(txHash);

    if (!tx) {
        throw new Error(
        "Transaction not found",
        );
    }

    return tx;
}