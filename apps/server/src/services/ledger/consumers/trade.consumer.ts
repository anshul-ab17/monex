import Decimal from "decimal.js";
import db from "@repo/db";
import { kafkaConsumer, KafkaTopics } from "@repo/kafka";
import { TradeEventType } from "@repo/events";
import type { TradeExecutedEvent } from "@repo/events";
import { ledgerService } from "../ledger.service";

export async function startTradeConsumer() {
    await kafkaConsumer.subscribe<TradeExecutedEvent>(
        "monex-trade-ledger-consumer",
        KafkaTopics.TRADES,
        async (event) => {
            if (event.eventType !== TradeEventType.EXECUTED) return;

            const { tradeId, buyerId, sellerId, quantity, price } = event.payload;

            const trade = await db.trade.findUnique({
                where: { id: tradeId },
                include: { market: true },
            });
            if (!trade) return;

            await ledgerService.settleTrade({
                tradeId,
                buyerId,
                sellerId,
                baseAssetId: trade.market.baseAssetId,
                quoteAssetId: trade.market.quoteAssetId,
                quantity: new Decimal(quantity),
                price: new Decimal(price),
                fee: new Decimal(trade.fee.toString()),
            });
        },
    );
}
