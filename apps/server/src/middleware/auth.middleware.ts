import type { FastifyRequest, FastifyReply } from "fastify";
import { sessionService } from "../services/auth/session.service";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
        const valid = await sessionService.validate(request.user.sub);
        if (!valid) {
            reply.code(401).send({ success: false, error: { message: "Session expired", code: "SESSION_EXPIRED" } });
        }
    } catch {
        reply.code(401).send({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    }
}
