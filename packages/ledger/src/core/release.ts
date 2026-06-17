export interface ReleaseInput {
    userId: string;
    assetId: string;
    amount: string;
    referenceId: string;
}

export async function release(
  input: ReleaseInput,
) {
  return input;
}