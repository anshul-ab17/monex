import { z } from "zod";

export class OrderSchema {
  public static create = z.object({
    marketId: z.string(),
    asset: z.string(),
    side: z.enum(["BUY", "SELL"]),
    type: z.enum(["LIMIT", "MARKET"]),
    price: z.number().positive().optional(),
    quantity: z.number().positive(),
    maxSlippage: z.number().positive().optional(),
  }).refine((data) => {
    if (data.type === "LIMIT" && !data.price) return false;
    if (data.type === "MARKET" && data.price) return false;
    return true;
  }, {
    message: "Invalid price for order type",
    path: ["price"],
  });
}

export type CreateOrderInput = z.infer<typeof OrderSchema.create>;