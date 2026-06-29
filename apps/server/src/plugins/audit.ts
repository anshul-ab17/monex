import fp from "fastify-plugin";
import db from "@repo/db";
import type { FastifyInstance } from "fastify";

// Models to audit — every mutation on these gets an AuditLog row
const AUDITED_MODELS = new Set([
    "LedgerEntry",
    "LedgerJournal",
    "Order",
    "Trade",
    "Withdrawal",
    "Deposit",
    "Balance",
]);

async function auditPlugin(app: FastifyInstance) {
    db.$use(async (params, next) => {
        const result = await next(params);

        if (
            params.model &&
            AUDITED_MODELS.has(params.model) &&
            ["create", "update", "delete", "createMany", "updateMany", "deleteMany"].includes(params.action)
        ) {
            try {
                await db.auditLog.create({
                    data: {
                        action: `${params.model}.${params.action}`,
                        entityType: params.model,
                        entityId: result?.id ?? "bulk",
                        metadata: {
                            args: JSON.parse(JSON.stringify(params.args ?? {})),
                        },
                    },
                });
            } catch {
                // Non-critical: audit log failure must never block the main operation
                app.log.warn("Audit log write failed");
            }
        }

        return result;
    });

    app.log.info("Audit log middleware registered");
}

export default fp(auditPlugin, { name: "audit" });
