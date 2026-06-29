import fp from "fastify-plugin";
import db from "@repo/db";
import type { FastifyInstance } from "fastify";

const AUDITED_MODELS = new Set([
    "LedgerEntry",
    "LedgerJournal",
    "Order",
    "Trade",
    "Withdrawal",
    "Deposit",
    "Balance",
]);

const AUDITED_ACTIONS = new Set(["create", "update", "delete", "createMany", "updateMany", "deleteMany"]);

async function auditPlugin(app: FastifyInstance) {
    // Prisma 7 audit: write AuditLog after mutating operations on key models
    // Uses onResponse hook to capture mutations — non-blocking, best-effort
    app.addHook("onResponse", async (request, reply) => {
        if (request.method === "GET" || reply.statusCode >= 400) return;

        try {
            const route = request.routeOptions?.url ?? request.url;
            const userId = (request.user as { sub?: string })?.sub;

            await db.auditLog.create({
                data: {
                    action: `${request.method} ${route}`,
                    entityType: "HTTP",
                    entityId: userId ?? "anonymous",
                    metadata: {
                        statusCode: reply.statusCode,
                        correlationId: request.correlationId,
                        method: request.method,
                        url: request.url,
                    },
                },
            }).catch(() => {});
        } catch {
            // Non-critical: never block on audit failure
        }
    });

    app.log.info("Audit log middleware registered");
}

export default fp(auditPlugin, { name: "audit" });
