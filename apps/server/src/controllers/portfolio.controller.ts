import type { FastifyRequest, FastifyReply } from "fastify";
import { ok } from "../utils/response";
import { portfolioService } from "../services/portfolio/portfolio.service";
import { feeTierService } from "../services/market/fee-tier.service";

export const portfolioController = {
    async getPortfolio(request: FastifyRequest, reply: FastifyReply) {
        const portfolio = await portfolioService.getPortfolio(request.user.sub);
        return reply.send(ok(portfolio));
    },

    async getFeeTier(request: FastifyRequest, reply: FastifyReply) {
        const fees = await feeTierService.getUserFees(request.user.sub);
        return reply.send(ok({
            makerFee: fees.makerFee.toString(),
            takerFee: fees.takerFee.toString(),
        }));
    },

    async listFeeTiers(_request: FastifyRequest, reply: FastifyReply) {
        return reply.send(ok(feeTierService.getTiers()));
    },
};
