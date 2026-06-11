import { z } from "zod";

export class WalletSchema {
  public static withdraw = z.object({
    assetId: z.uuid(),
    amount: z.number().positive(),
    destinationAddress: z.string().min(32),
  });

  public static deposit = z.object({
    txHash: z.string(),
  });
}

export type WithdrawInput = z.infer<typeof WalletSchema.withdraw>;

export type DepositInput = z.infer<typeof WalletSchema.deposit>;