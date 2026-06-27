"use client";

import { use } from "react";

export default function TradePage({
  params,
}: {
  params: Promise<{ marketId: string }>;
}) {
  const { marketId } = use(params);

  return (
    <div className="grid h-full grid-cols-[1fr_280px_320px] grid-rows-[auto_1fr_240px] gap-px bg-border">
      {/* Row 1: Ticker bar spanning full width */}
      <div className="col-span-3 bg-surface px-4 py-2">
        <span className="font-mono text-sm text-text-secondary">
          Market: {marketId}
        </span>
      </div>

      {/* Row 2: Chart | OrderBook | Order Form */}
      <div className="bg-surface p-2">
        <div className="flex h-full items-center justify-center text-text-muted">
          Chart placeholder
        </div>
      </div>
      <div className="bg-surface p-2">
        <div className="flex h-full items-center justify-center text-text-muted">
          OrderBook placeholder
        </div>
      </div>
      <div className="bg-surface p-2">
        <div className="flex h-full items-center justify-center text-text-muted">
          Order Form placeholder
        </div>
      </div>

      {/* Row 3: Open Orders | Recent Trades */}
      <div className="col-span-2 bg-surface p-2">
        <div className="flex h-full items-center justify-center text-text-muted">
          Open Orders placeholder
        </div>
      </div>
      <div className="bg-surface p-2">
        <div className="flex h-full items-center justify-center text-text-muted">
          Recent Trades placeholder
        </div>
      </div>
    </div>
  );
}
