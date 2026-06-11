import {z} from "zod";

export class AuthSchema{
    public static signup =  z.object({
        walletAddress : z.string().min(32),
        signature:z.string().min(64),
        nonce:z.string()
    })

    public static signin = AuthSchema.signup;

    public static refresh = z.object({
        refresh : z.string()
    });
};

export type SignUpInput = z.infer<typeof AuthSchema.signup>;
export type SignInInput =z.infer<typeof AuthSchema.signin>;
export type RefreshInput =z.infer<typeof AuthSchema.refresh>;