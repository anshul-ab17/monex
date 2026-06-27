import { startAuthConsumer } from "./auth.consumer";
import { startOrderConsumer } from "./order.consumer";
import { startWalletConsumer } from "./wallet.consumer";
import { env } from "@repo/config";

export async function startConsumers() {
    if (!env.USE_KAFKA) return;
    await startAuthConsumer();
    await startOrderConsumer();
    await startWalletConsumer();
}
