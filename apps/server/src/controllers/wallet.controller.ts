import type { FastifyRequest, FastifyReply } from "fastify";
import { WalletSchema } from "@repo/validation";
import { ok, fail } from "../utils/response";
import { walletService } from "../services/wallet/wallet.service";
import { depositService } from "../services/wallet/deposit.service";
import { walletPublisher } from "../publishers/wallet.publisher";

export class WalletController {
    async getBalances(request: FastifyRequest, reply: FastifyReply) {
        const balances = await walletService.getBalances(request.user.sub);
        return reply.send(ok(balances));
    }

    async getDepositAddress(request: FastifyRequest, reply: FastifyReply) {
        const { assetId } = request.query as { assetId?: string };
        if (!assetId) return reply.code(400).send(fail("assetId query param required"));

        const result = await walletService.getDepositAddress(assetId);
        return reply.send(ok(result));
    }

    async submitDeposit(request: FastifyRequest, reply: FastifyReply) {
        const parsed = WalletSchema.deposit.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

        const userId = request.user.sub;
        const deposit = await depositService.submitDeposit(userId, parsed.data.txHash);

        await walletPublisher.depositConfirmed({
            userId,
            assetId: deposit.assetId,
            amount: deposit.amount.toString(),
            txHash: deposit.txHash,
        });

        return reply.code(201).send(ok(deposit));
    }

    async getDeposits(request: FastifyRequest, reply: FastifyReply) {
        const deposits = await depositService.getDepositsByUser(request.user.sub);
        return reply.send(ok(deposits));
    }

    async getDepositById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const deposit = await depositService.getDepositById(request.user.sub, id);
        return reply.send(ok(deposit));
    }
}
