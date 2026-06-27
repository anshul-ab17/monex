import { startAuthConsumer } from "./auth.consumer";
import { startOrderConsumer } from "./order.consumer";
import { startWalletConsumer } from "./wallet.consumer";
import { startWithdrawalConsumer } from "./withdrawal.consumer";
import { startTradeConsumer } from "../services/ledger/consumers/trade.consumer";
import { env } from "@repo/config";

export async function startConsumers() {
    if (!env.USE_KAFKA) return;
    await startAuthConsumer();
    await startOrderConsumer();
    await startWalletConsumer();
    await startWithdrawalConsumer();
    await startTradeConsumer();
}
