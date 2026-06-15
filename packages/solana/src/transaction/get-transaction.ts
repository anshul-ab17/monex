import { connection } from "../client/connection";

export async function getTransaction( signature: string,) {
    return connection.getParsedTransaction(
        signature,
        {
        maxSupportedTransactionVersion: 0,
        },
    );
}