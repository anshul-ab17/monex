import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { AuthService } from "../services/auth/auth.service";
import { AuthSchema } from "@repo/validation";
import { ok, fail } from "../utils/response";
import { AppError } from "../utils/errors";
import { authPublisher } from "../publishers/auth.publisher";

export class AuthController {
    private service: AuthService;

    constructor(app: FastifyInstance) {
        this.service = new AuthService(app);
    }

    async getNonce(request: FastifyRequest, reply: FastifyReply) {
        const { wallet } = request.query as { wallet?: string };
        if (!wallet) {
            return reply.code(400).send(fail("wallet query param required"));
        }
        const nonce = await this.service.generateNonce(wallet);
        return reply.send(ok({ nonce }));
    }

    async walletLogin(request: FastifyRequest, reply: FastifyReply) {
        const result = AuthSchema.signin.safeParse(request.body);
        if (!result.success) {
            return reply.code(400).send(fail(result.error.message));
        }
        const { walletAddress, signature, nonce } = result.data;

        const data = await this.service.walletLogin(walletAddress, signature, nonce);
        const pub = data.isNew ? authPublisher.userRegistered : authPublisher.userLoggedIn;
        await pub.call(authPublisher, { userId: data.user.id, walletAddress: data.user.walletAddress });
        return reply.send(ok({ accessToken: data.accessToken, refreshToken: data.refreshToken }));
    }

    async refresh(request: FastifyRequest, reply: FastifyReply) {
        const result = AuthSchema.refresh.safeParse(request.body);
        if (!result.success) {
            return reply.code(400).send(fail("refresh token required"));
        }
        const data = await this.service.refresh(result.data.refresh);
        return reply.send(ok(data));
    }

    async logout(request: FastifyRequest, reply: FastifyReply) {
        await request.jwtVerify();
        await this.service.logout(request.user.sub);
        return reply.send(ok(null));
    }
}
