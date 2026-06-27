import type { FastifyRequest, FastifyReply } from "fastify";
import { assetService } from "../services/asset/asset.service";
import { ok } from "../utils/response";

export const assetController = {
    async list(_request: FastifyRequest, reply: FastifyReply) {
        const assets = await assetService.list();
        return reply.send(ok(assets));
    },

    async getById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const asset = await assetService.getById(id);
        return reply.send(ok(asset));
    },
};
