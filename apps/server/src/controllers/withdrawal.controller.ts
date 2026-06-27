import type { FastifyRequest, FastifyReply } from "fastify";
import { WalletSchema } from "validation";
import { ok, fail } from "../utils/response";
import { withdrawalService } from "../services/wallet/withdrawal.service";
import { walletPublisher } from "../publishers/wallet.publisher";

export class WithdrawalController {
    async requestWithdrawal(request: FastifyRequest, reply: FastifyReply) {
        const parsed = WalletSchema.withdraw.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

        const userId = request.user.sub;
        const withdrawal = await withdrawalService.requestWithdrawal(userId, parsed.data);

        await walletPublisher.withdrawalRequested({
            withdrawalId: withdrawal.id,
            userId,
            assetId: withdrawal.assetId,
            amount: withdrawal.amount.toString(),
            destinationAddress: withdrawal.destinationAddress,
        });

        return reply.code(201).send(ok(withdrawal));
    }

    async getWithdrawals(request: FastifyRequest, reply: FastifyReply) {
        const withdrawals = await withdrawalService.getWithdrawalsByUser(request.user.sub);
        return reply.send(ok(withdrawals));
    }

    async getWithdrawalById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const withdrawal = await withdrawalService.getWithdrawalById(request.user.sub, id);
        return reply.send(ok(withdrawal));
    }
}
