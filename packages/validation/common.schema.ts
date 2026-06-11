import { z } from "zod";

export class CommonSchema {
  public static idParam = z.object({
    id: z.uuid(),
  });

  public static pagination = z.object({
    page: z.coerce.number()
       .positive()
       .default(1),

    limit: z.coerce.number()
       .positive()
       .max(100)
       .default(20),
  });
}