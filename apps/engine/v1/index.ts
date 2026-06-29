import { kafkaProducer } from "@repo/kafka";
import { orderBookStore } from "./src/orderbook/index";
import { startEngineConsumer } from "./src/consumer";
import { stopMonitor } from "./src/stop-monitor";

async function main() {
    console.log("[engine] starting");

    await kafkaProducer.connect();
    await orderBookStore.loadFromDb();
    await stopMonitor.loadPending();
    await startEngineConsumer();

    console.log("[engine] ready");

    process.on("SIGTERM", async () => {
        await kafkaProducer.disconnect();
        process.exit(0);
    });
}

main().catch((err) => {
    console.error("[engine] fatal:", err);
    process.exit(1);
});
