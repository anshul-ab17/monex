"use client";

import { useState, useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { formatPrice, formatQty } from "@/lib/utils";

interface Trade {
  price: string;
  quantity: string;
  side: "BUY" | "SELL";
  timestamp: string;
}

interface RecentTradesProps {
  marketId: string;
}

export function RecentTrades({ marketId }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useWebSocket(
    marketId ? `market:trades:${marketId}` : null,
    useCallback((data: unknown) => {
      const trade = data as Trade;
      setTrades((prev) => [trade, ...prev].slice(0, 50));
    }, [])
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-white/5 px-3 py-2">
        <span className="text-[12px] font-semibold text-text-primary">Recent Trades</span>
      </div>
      <div className="flex px-3 py-1 text-[10px] uppercase tracking-wider text-text-muted">
        <span className="w-2/5">Price</span>
        <span className="w-2/5 text-right">Size</span>
        <span className="w-1/5 text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[11px] text-text-muted">
            Waiting for trades...
          </div>
        ) : (
          trades.map((t, i) => (
            <div key={i} className="flex items-center px-3 py-[2px] font-mono text-[12px] transition-colors hover:bg-white/[0.02]">
              <span className={`w-2/5 ${t.side === "BUY" ? "text-green" : "text-red"}`}>
                {formatPrice(t.price)}
              </span>
              <span className="w-2/5 text-right text-text-secondary">{formatQty(t.quantity)}</span>
              <span className="w-1/5 text-right text-text-muted text-[11px]">
                {new Date(t.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
