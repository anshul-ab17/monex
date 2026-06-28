"use client";

import { use } from "react";
import { EventHeader } from "@/components/trade/event-header";
import { ProbabilityChart } from "@/components/trade/probability-chart";
import { OrderBook } from "@/components/trade/orderbook";
import { RecentTrades } from "@/components/trade/recent-trades";
import { PredictOrderForm } from "@/components/trade/predict-order-form";
import { ActiveBetsPanel } from "@/components/trade/active-bets-panel";

export default function PredictPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  return (
    <div className="flex h-full flex-col gap-2 bg-background p-1">
      <EventHeader eventId={eventId} />

      <div className="flex flex-1 gap-0.5 overflow-hidden">
        <div className="flex-1 overflow-hidden rounded-md bg-surface">
          <ProbabilityChart eventId={eventId} />
        </div>

        <div className="flex w-[280px] shrink-0 flex-col gap-0.5">
          <div className="flex-1 overflow-hidden rounded-md bg-surface">
            <OrderBook marketId={eventId} />
          </div>
          <div className="h-[200px] shrink-0 overflow-hidden rounded-md bg-surface">
            <RecentTrades marketId={eventId} />
          </div>
        </div>

        <div className="w-[300px] shrink-0 overflow-hidden rounded-md bg-surface">
          <PredictOrderForm eventId={eventId} />
        </div>
      </div>

      <div className="h-[180px] shrink-0 overflow-hidden rounded-md bg-surface">
        <ActiveBetsPanel eventId={eventId} />
      </div>
    </div>
  );
}
