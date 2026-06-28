import Decimal from "decimal.js";
import db from "@repo/db";
import { kafkaConsumer, KafkaTopics } from "@repo/kafka";
import { TradeEventType } from "@repo/events";
import type { TradeExecutedEvent } from "@repo/events";
import { ledgerService } from "../ledger.service";
import { candleService } from "../../market/candle.service";
import { tickerService } from "../../market/ticker.service";
import { redis } from "@repo/redis";

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

            const priceD = new Decimal(price);
            const qtyD = new Decimal(quantity);

            await ledgerService.settleTrade({
                tradeId,
                buyerId,
                sellerId,
                baseAssetId: trade.market.baseAssetId,
                quoteAssetId: trade.market.quoteAssetId,
                quantity: qtyD,
                price: priceD,
                makerFee: new Decimal(trade.makerFee.toString()),
                takerFee: new Decimal(trade.takerFee.toString()),
                takerSide: trade.takerSide,
            });

            await candleService.updateFromTrade(trade.marketId, priceD, qtyD, trade.createdAt);

            const candleMsg = JSON.stringify({
                event: "candle",
                payload: {
                    marketId: trade.marketId,
                    price: price,
                    quantity: quantity,
                    timestamp: trade.createdAt.toISOString(),
                },
            });
            await redis.publish(`market:candle:${trade.marketId}`, candleMsg);

            const tradeMsg = JSON.stringify({
                event: "trade",
                payload: {
                    tradeId: event.payload.tradeId,
                    marketId: trade.marketId,
                    price: event.payload.price,
                    quantity: event.payload.quantity,
                    takerSide: trade.takerSide,
                    timestamp: trade.createdAt.toISOString(),
                },
            });
            await redis.publish(`market:trades:${trade.marketId}`, tradeMsg);

            await tickerService.publishTicker(trade.marketId);
        },
    );
}
