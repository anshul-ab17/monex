import { kafkaConsumer } from "@repo/kafka";
import { KafkaTopics } from "@repo/kafka";
import { AuthEventType } from "@repo/events";
import type { UserRegisteredEvent } from "@repo/events";
import db from "@repo/db";
import { ledgerService } from "../services/ledger";

export async function startAuthConsumer() {
    await kafkaConsumer.subscribe<UserRegisteredEvent>(
        "reishi-auth-consumer",
        KafkaTopics.AUTH,
        async (event) => {
            if (event.eventType !== AuthEventType.USER_REGISTERED) return;

            const { userId } = event.payload;

            // Create LedgerAccount + Balance for every active asset
            const assets = await db.asset.findMany({ select: { id: true } });
            const assetIds = assets.map((a) => a.id);

            if (assetIds.length > 0) {
                await ledgerService.initUserAccounts(userId, assetIds);
            }
        },
    );
}
