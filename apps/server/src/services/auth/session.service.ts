import { createSession, getSession, deleteSession } from "@repo/redis";

export class SessionService {
    async create(userId: string, sessionId: string) {
        await createSession(userId, sessionId);
    }

    async validate(userId: string): Promise<boolean> {
        return (await getSession(userId)) !== null;
    }

    async destroy(userId: string) {
        await deleteSession(userId);
    }
}

export const sessionService = new SessionService();
