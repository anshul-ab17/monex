"use client";

import { use } from "react";
import { TickerBar } from "@/components/trade/ticker-bar";
import { TradingChart } from "@/components/trade/trading-chart";
import { OrderBook } from "@/components/trade/orderbook";
import { RecentTrades } from "@/components/trade/recent-trades";
import { FuturesOrderForm } from "@/components/trade/futures-order-form";
import { PositionsPanel } from "@/components/trade/positions-panel";

export default function FuturesPage({
  params,
}: {
  params: Promise<{ marketId: string }>;
}) {
  const { marketId } = use(params);

  return (
    <div className="flex h-full flex-col gap-2 bg-background p-1">
      <TickerBar marketId={marketId} />

      <div className="flex flex-1 gap-0.5 overflow-hidden">
        <div className="flex-1 overflow-hidden rounded-md bg-surface">
          <TradingChart marketId={marketId} />
        </div>

        <div className="flex w-[280px] shrink-0 flex-col gap-0.5">
          <div className="flex-1 overflow-hidden rounded-md bg-surface">
            <OrderBook marketId={marketId} />
          </div>
          <div className="h-[200px] shrink-0 overflow-hidden rounded-md bg-surface">
            <RecentTrades marketId={marketId} />
          </div>
        </div>

        <div className="w-[300px] shrink-0 overflow-hidden rounded-md bg-surface">
          <FuturesOrderForm marketId={marketId} />
        </div>
      </div>

      <div className="h-[200px] shrink-0 overflow-hidden rounded-md bg-surface">
        <PositionsPanel marketId={marketId} />
      </div>
    </div>
  );
}
