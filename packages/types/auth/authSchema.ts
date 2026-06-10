import {z} from "zod";

export class AuthSchema{
    public static signup =  z.object({
        
    })

    public static signin = AuthSchema.signup;

    public static refresh = z.object({
        refresh : z.string()
    });
};

export type SignUpInput = z.infer<typeof AuthSchema.signup>;
export type SignInInput =z.infer<typeof AuthSchema.signin>;
export type RefreshInput =z.infer<typeof AuthSchema.refresh>;