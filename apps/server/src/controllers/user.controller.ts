import type { FastifyRequest, FastifyReply } from "fastify";
import db from "@repo/db";
import { ok } from "../utils/response";
import { NotFoundError } from "../utils/errors";

export const userController = {
    async getMe(request: FastifyRequest, reply: FastifyReply) {
        const { userId } = request.user as { userId: string };
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, walletAddress: true, createdAt: true },
        });
        if (!user) throw new NotFoundError("User not found");
        return reply.send(ok(user));
    },

    async updateMe(request: FastifyRequest, reply: FastifyReply) {
        const { userId } = request.user as { userId: string };
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, walletAddress: true, createdAt: true },
        });
        if (!user) throw new NotFoundError("User not found");
        return reply.send(ok(user));
    },
};
