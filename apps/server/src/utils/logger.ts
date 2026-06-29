import { randomUUID } from "crypto";
import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";

export function correlationIdHook(request: FastifyRequest, _reply: FastifyReply, done: () => void) {
    const correlationId = (request.headers["x-correlation-id"] as string) ?? randomUUID();
    request.correlationId = correlationId;
    request.log = request.log.child({ correlationId });
    done();
}

export function registerCorrelationId(app: FastifyInstance) {
    app.decorateRequest("correlationId", "");
    app.addHook("onRequest", correlationIdHook);
    app.addHook("onSend", (_request, reply, payload, done) => {
        reply.header("x-correlation-id", _request.correlationId);
        done(null, payload);
    });
}
