import z from "zod";

export class UserSchema {
    public static idParam =z.object({
        id: z.uuid()
    })
}

export type  UserIdParam = z.infer<typeof UserSchema.idParam>;