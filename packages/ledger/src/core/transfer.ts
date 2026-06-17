export interface TransferInput {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    referenceId: string;
}

export async function transfer(
  input: TransferInput,
) {
  return input;
}