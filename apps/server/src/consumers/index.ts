import { startAuthConsumer } from "./auth.consumer";
import { env } from "@repo/config";

export async function startConsumers() {
    if (!env.USE_KAFKA) return;
    await startAuthConsumer();
}
