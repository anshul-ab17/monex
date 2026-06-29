import { z } from "zod";

export class PredictionSchema {
  public static create = z.object({
    symbol: z.string().min(1).max(32),
    name: z.string().min(3).max(128),
    resolvesAt: z.string().datetime(),
    quoteAssetId: z.uuid(),
    outcomes: z
      .array(
        z.object({
          name: z.string().min(1).max(64),
          description: z.string().max(256).optional(),
        }),
      )
      .min(2)
      .max(10),
  });

  public static resolve = z.object({
    winningOutcomeId: z.uuid(),
  });
}

export type CreatePredictionInput = z.infer<typeof PredictionSchema.create>;
export type ResolvePredictionInput = z.infer<typeof PredictionSchema.resolve>;
