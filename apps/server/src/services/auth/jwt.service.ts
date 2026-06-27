import type { FastifyInstance } from "fastify";
import type { JwtPayload } from "@repo/types";

export class JwtService {
    constructor(private app: FastifyInstance) {}

    signAccess(payload: JwtPayload): string {
        return this.app.jwt.sign(payload);
    }

    signRefresh(payload: JwtPayload): string {
        return this.app.jwt.sign(payload, { expiresIn: "7d" });
    }

    verify(token: string): JwtPayload {
        return this.app.jwt.verify<JwtPayload>(token);
    }
}
