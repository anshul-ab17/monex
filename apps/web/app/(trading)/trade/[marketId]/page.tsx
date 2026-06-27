"use client";

import { use } from "react";
import { TickerBar } from "@/components/trade/ticker-bar";
import { TradingChart } from "@/components/trade/trading-chart";
import { OrderBook } from "@/components/trade/orderbook";
import { OrderForm } from "@/components/trade/order-form";
import { RecentTrades } from "@/components/trade/recent-trades";
import { OpenOrders } from "@/components/trade/open-orders";

export default function TradePage({
  params,
}: {
  params: Promise<{ marketId: string }>;
}) {
  const { marketId } = use(params);

  return (
    <div className="grid h-full grid-cols-[1fr_280px_320px] grid-rows-[auto_1fr_240px] gap-px bg-border">
      {/* Ticker */}
      <div className="col-span-3 bg-surface">
        <TickerBar marketId={marketId} />
      </div>

      {/* Chart */}
      <div className="bg-surface">
        <TradingChart marketId={marketId} />
      </div>

      {/* OrderBook */}
      <div className="bg-surface">
        <OrderBook marketId={marketId} />
      </div>

      {/* Order Form */}
      <div className="bg-surface">
        <OrderForm marketId={marketId} />
      </div>

      {/* Open Orders */}
      <div className="col-span-2 bg-surface">
        <OpenOrders marketId={marketId} />
      </div>

      {/* Recent Trades */}
      <div className="bg-surface">
        <RecentTrades marketId={marketId} />
      </div>
    </div>
  );
}
