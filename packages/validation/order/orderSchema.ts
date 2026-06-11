import { z } from "zod";
import {
  OrderSide,
  OrderType,
  TimeInForce,
} from "@repo/types";

export class OrderSchema {
  public static create = z
    .object({
      marketId: z.uuid(),

      side: z.enum(OrderSide),
      type: z.enum(OrderType),
      quantity: z.number().positive(),
      price: z.number().positive().optional(),

      timeInForce: z
        .enum(TimeInForce)
        .default(TimeInForce.GTC),

      postOnly: z.boolean().default(false),
      reduceOnly: z.boolean().default(false),
      maxSlippage:
        z.number().positive().optional(),
    })
    .refine(
      (data) => {
        if ( data.type === OrderType.LIMIT &&
          !data.price
        )
          return false;

        if (
          data.type === OrderType.MARKET &&
          data.price
        )
          return false;

        return true;
      },
      {
        message:
          "Invalid price for order type",
        path: ["price"],
      },
    );
}

export type CreateOrderInput =
  z.infer<typeof OrderSchema.create>;