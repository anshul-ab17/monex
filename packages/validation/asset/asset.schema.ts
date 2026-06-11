import { z } from "zod";

export class AssetSchema {
  public static create = z.object({
    symbol: z.string().min(2).max(10),
    name: z.string().min(2),
    decimals: z.number().min(0).max(18),
  });
}

export type CreateAssetInput = z.infer<typeof AssetSchema.create>;