import Decimal from "decimal.js";
import db from "@repo/db";
import { kafkaConsumer, KafkaTopics } from "@repo/kafka";
import { TradeEventType } from "@repo/events";
import type { TradeExecutedEvent } from "@repo/events";
import { ledgerService } from "../ledger.service";
import { candleService } from "../../market/candle.service";
import { tickerService } from "../../market/ticker.service";
import { positionService } from "../../position/position.service";
import { redis } from "@repo/redis";
import { decodeEnvelope, decode } from "@repo/proto";
import { userEventsService } from "../../user/user-events.service";

async function parseTradeEvent(event: TradeExecutedEvent & { __raw?: Buffer }): Promise<TradeExecutedEvent | null> {
    if (event.__raw) {
        const envelope = await decodeEnvelope(new Uint8Array(event.__raw));
        if (envelope.eventType !== TradeEventType.EXECUTED) return null;
        const inner = await decode<TradeExecutedEvent["payload"]>("TradeExecuted", new Uint8Array(envelope.payload));
        return {
            eventId: inner.tradeId,
            eventType: envelope.eventType as typeof TradeEventType.EXECUTED,
            timestamp: new Date(envelope.timestamp).toISOString(),
            version: envelope.version,
            payload: inner,
        };
    }
    return event;
}

export async function startTradeConsumer() {
    await kafkaConsumer.subscribe<TradeExecutedEvent & { __raw?: Buffer }>(
        "monex-trade-ledger-consumer",
        KafkaTopics.TRADES,
        async (rawEvent) => {
            const event = await parseTradeEvent(rawEvent);
            if (!event || event.eventType !== TradeEventType.EXECUTED) return;

            const {
                tradeId,
                buyOrderId,
                sellOrderId,
                buyerId,
                sellerId,
                marketId,
                quantity,
                price,
                makerFee,
                takerFee,
                takerSide,
            } = event.payload;

            // Idempotency: skip if already processed
            const existing = await db.trade.findUnique({ where: { id: tradeId } });
            if (existing) return;

            const market = await db.market.findUnique({ where: { id: marketId } });
            if (!market) return;

            const priceD = new Decimal(price);
            const qtyD = new Decimal(quantity);
            const makerFeeD = new Decimal(makerFee);
            const takerFeeD = new Decimal(takerFee);

            // INSERT Trade record first
            const trade = await db.trade.create({
                data: {
                    id: tradeId,
                    marketId,
                    buyerId,
                    sellerId,
                    buyOrderId,
                    sellOrderId,
                    takerSide: takerSide as "BUY" | "SELL",
                    price: priceD.toString(),
                    quantity: qtyD.toString(),
                    makerFee: makerFeeD.toString(),
                    takerFee: takerFeeD.toString(),
                    fee: makerFeeD.add(takerFeeD).toString(),
                },
            });

            // Settle balances in ledger
            await ledgerService.settleTrade({
                tradeId,
                buyerId,
                sellerId,
                baseAssetId: market.baseAssetId,
                quoteAssetId: market.quoteAssetId,
                quantity: qtyD,
                price: priceD,
                makerFee: makerFeeD,
                takerFee: takerFeeD,
                takerSide: takerSide as "BUY" | "SELL",
            });

            // Update order fill quantities (best-effort, engine also tracks)
            await db.order.update({
                where: { id: buyOrderId },
                data: {
                    filledQty: { increment: qtyD.toString() },
                    remainingQty: { decrement: qtyD.toString() },
                },
            }).catch(() => {});

            await db.order.update({
                where: { id: sellOrderId },
                data: {
                    filledQty: { increment: qtyD.toString() },
                    remainingQty: { decrement: qtyD.toString() },
                },
            }).catch(() => {});

            // Update positions
            await positionService.updateFromTrade({ userId: buyerId, marketId, side: "BUY", quantity: qtyD, price: priceD });
            await positionService.updateFromTrade({ userId: sellerId, marketId, side: "SELL", quantity: qtyD, price: priceD });

            // Aggregate candles
            await candleService.updateFromTrade(marketId, priceD, qtyD, trade.createdAt);

            // Publish real-time updates
            await redis.publish(`market:candle:${marketId}`, JSON.stringify({
                event: "candle",
                payload: { marketId, price, quantity, timestamp: trade.createdAt.toISOString() },
            }));

            await redis.publish(`market:trades:${marketId}`, JSON.stringify({
                event: "trade",
                payload: { tradeId, marketId, price, quantity, takerSide, timestamp: trade.createdAt.toISOString() },
            }));

            await tickerService.publishTicker(marketId);

            // Notify users about order fills
            await userEventsService.publishOrderUpdate(buyerId, {
                orderId: buyOrderId, status: "FILL", marketId,
                filledQty: qtyD.toString(), price,
            });
            await userEventsService.publishOrderUpdate(sellerId, {
                orderId: sellOrderId, status: "FILL", marketId,
                filledQty: qtyD.toString(), price,
            });
        },
    );
}
