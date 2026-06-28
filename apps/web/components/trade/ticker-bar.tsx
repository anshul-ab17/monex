"use client";

import { useState, useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useMarket } from "@/hooks/use-markets";
import { formatPrice, formatPercent, cn } from "@/lib/utils";

interface TickerData {
  lastPrice: string;
  change24h: number;
  high24h: string;
  low24h: string;
  volume24h: string;
}

interface TickerBarProps {
  marketId: string;
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className={cn("font-mono text-[13px] text-text-secondary", className)}>{value}</span>
    </div>
  );
}

export function TickerBar({ marketId }: TickerBarProps) {
  const { data: market } = useMarket(marketId);
  const [ticker, setTicker] = useState<TickerData | null>(null);

  useWebSocket(
    marketId ? `market:ticker:${marketId}` : null,
    useCallback((data: unknown) => setTicker(data as TickerData), [])
  );

  const label = market ? `${market.baseAsset.symbol}/${market.quoteAsset.symbol}` : marketId.replace("-", "/").toUpperCase();

  return (
    <div className="flex h-10 items-center gap-5 rounded-md bg-surface px-4">
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-bold text-text-primary">{label}</span>
        {ticker && (
          <span className={cn("font-mono text-[15px] font-bold", ticker.change24h >= 0 ? "text-green" : "text-red")}>
            {formatPrice(ticker.lastPrice)}
          </span>
        )}
      </div>
      {ticker ? (
        <div className="flex items-center gap-4 border-l border-white/5 pl-4">
          <Stat
            label="24h"
            value={formatPercent(ticker.change24h)}
            className={ticker.change24h >= 0 ? "text-green" : "text-red"}
          />
          <Stat label="High" value={formatPrice(ticker.high24h)} />
          <Stat label="Low" value={formatPrice(ticker.low24h)} />
          <Stat label="Vol" value={formatPrice(ticker.volume24h)} />
        </div>
      ) : (
        <div className="flex items-center gap-4 border-l border-white/5 pl-4">
          <span className="font-mono text-xs text-text-muted">Connecting...</span>
        </div>
      )}
    </div>
  );
}
