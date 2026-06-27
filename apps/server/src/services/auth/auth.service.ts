import { randomUUID } from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import type { FastifyInstance } from "fastify";
import db from "@repo/db";
import { storeNonce, getNonce, deleteNonce } from "@repo/redis";
import { UnauthorizedError, BadRequestError } from "../../utils/errors";
import { JwtService } from "./jwt.service";
import { sessionService } from "./session.service";

export class AuthService {
    private jwt: JwtService;

    constructor(private app: FastifyInstance) {
        this.jwt = new JwtService(app);
    }

    async generateNonce(wallet: string): Promise<string> {
        const nonce = randomUUID();
        await storeNonce(wallet, nonce);
        return nonce;
    }

    async walletLogin(walletAddress: string, signature: string, nonce: string) {
        const storedNonce = await getNonce(walletAddress);
        await deleteNonce(walletAddress); // always delete — prevents replay

        if (!storedNonce || storedNonce !== nonce) {
            throw new UnauthorizedError("Invalid or expired nonce");
        }

        const messageBytes = new TextEncoder().encode(nonce);
        let sigBytes: Uint8Array;
        let pubKeyBytes: Uint8Array;
        try {
            sigBytes = bs58.decode(signature);
            pubKeyBytes = bs58.decode(walletAddress);
        } catch {
            throw new BadRequestError("Invalid signature or wallet encoding");
        }

        const valid = nacl.sign.detached.verify(messageBytes, sigBytes, pubKeyBytes);
        if (!valid) {
            throw new UnauthorizedError("Signature verification failed");
        }

        const existing = await db.user.findUnique({
            where: { walletAddress },
            select: { id: true },
        });

        const user = await db.user.upsert({
            where: { walletAddress },
            create: { walletAddress },
            update: {},
            select: { id: true, walletAddress: true, createdAt: true },
        });

        const isNew = !existing;
        const payload = { sub: user.id, walletAddress: user.walletAddress };
        const accessToken = this.jwt.signAccess(payload);
        const refreshToken = this.jwt.signRefresh(payload);

        const refreshTokenHash = await Bun.password.hash(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const session = await db.session.create({
            data: { userId: user.id, refreshTokenHash, expiresAt },
            select: { id: true },
        });

        await sessionService.create(user.id, session.id);

        return { accessToken, refreshToken, user, isNew };
    }

    async refresh(refreshToken: string) {
        let payload: { sub: string; walletAddress: string };
        try {
            payload = this.jwt.verify(refreshToken);
        } catch {
            throw new UnauthorizedError("Invalid refresh token");
        }

        const sessions = await db.session.findMany({
            where: { userId: payload.sub, expiresAt: { gt: new Date() } },
        });

        for (const session of sessions) {
            const match = await Bun.password.verify(refreshToken, session.refreshTokenHash);
            if (match) {
                const accessToken = this.jwt.signAccess({
                    sub: payload.sub,
                    walletAddress: payload.walletAddress,
                });
                return { accessToken };
            }
        }

        throw new UnauthorizedError("Session not found or expired");
    }

    async logout(userId: string) {
        await sessionService.destroy(userId);
        await db.session.deleteMany({ where: { userId } });
    }
}
