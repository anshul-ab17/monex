import type { FastifyRequest, FastifyReply } from "fastify";
import { OrderSchema } from "validation";
import { ok, fail } from "../utils/response";
import { orderService } from "../services/order/order.service";
import { orderPublisher } from "../publishers/order.publisher";

export class OrderController {
    async create(request: FastifyRequest, reply: FastifyReply) {
        const result = OrderSchema.create.safeParse(request.body);
        if (!result.success) {
            return reply.code(400).send(fail(result.error.message));
        }

        const userId = request.user.sub;
        const order = await orderService.create(userId, result.data);

        await orderPublisher.orderCreated({
            orderId: order.id,
            userId,
            marketId: order.marketId,
            side: order.side,
            type: order.type,
            quantity: order.quantity.toString(),
            price: order.price?.toString(),
        });

        return reply.code(201).send(ok(order));
    }

    async cancel(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const userId = request.user.sub;

        const order = await orderService.cancel(userId, id);

        await orderPublisher.orderCancelled({
            orderId: order.id,
            userId,
            marketId: order.marketId,
        });

        return reply.send(ok({ cancelled: true }));
    }

    async getById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const order = await orderService.getById(request.user.sub, id);
        return reply.send(ok(order));
    }

    async list(request: FastifyRequest, reply: FastifyReply) {
        const { page = "1", limit = "20" } = request.query as { page?: string; limit?: string };
        const result = await orderService.listByUser(
            request.user.sub,
            Math.max(1, parseInt(page)),
            Math.min(100, parseInt(limit)),
        );
        return reply.send(ok(result));
    }
}
