import { withRetry } from "../client/connection";

export async function getTransaction(signature: string) {
    return withRetry((conn) =>
        conn.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        }),
    );
}
