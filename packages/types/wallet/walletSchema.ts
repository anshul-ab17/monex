import z from "zod";


export class WalletSchema{
    public static deposit =z.object({
        assest: z.string(),
        amount:z.number().positive()
    })
}

export type Deposit = z.infer<typeof WalletSchema.deposit>;