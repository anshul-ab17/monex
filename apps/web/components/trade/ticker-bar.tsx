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

export function TickerBar({ marketId }: TickerBarProps) {
  const { data: market } = useMarket(marketId);
  const [ticker, setTicker] = useState<TickerData | null>(null);

  useWebSocket(
    marketId ? `market:ticker:${marketId}` : null,
    useCallback((data: unknown) => setTicker(data as TickerData), [])
  );

  const label = market ? `${market.baseAsset.symbol}/${market.quoteAsset.symbol}` : marketId;

  return (
    <div className="flex items-center gap-6 px-4 py-2">
      <span className="text-base font-bold text-text-primary">{label}</span>
      {ticker ? (
        <>
          <span
            className={cn(
              "font-mono text-lg font-bold",
              ticker.change24h >= 0 ? "text-green" : "text-red"
            )}
          >
            {formatPrice(ticker.lastPrice)}
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted">24h Change</span>
            <span
              className={cn("font-mono text-xs", ticker.change24h >= 0 ? "text-green" : "text-red")}
            >
              {formatPercent(ticker.change24h)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted">24h High</span>
            <span className="font-mono text-xs text-text-secondary">{formatPrice(ticker.high24h)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted">24h Low</span>
            <span className="font-mono text-xs text-text-secondary">{formatPrice(ticker.low24h)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted">24h Volume</span>
            <span className="font-mono text-xs text-text-secondary">{formatPrice(ticker.volume24h)}</span>
          </div>
        </>
      ) : (
        <span className="font-mono text-sm text-text-muted">—</span>
      )}
    </div>
  );
}
