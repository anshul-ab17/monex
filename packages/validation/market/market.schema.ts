import { z } from "zod";

export class MarketSchema {
  public static create = z.object({
    title: z.string().min(3),
    description: z.string().optional(),

    assetId: z.uuid(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  });
}

export type CreateMarketInput =
  z.infer<typeof MarketSchema.create>;