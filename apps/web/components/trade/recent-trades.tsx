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
      <div className="px-2 py-1">
        <span className="text-xs font-semibold text-text-secondary">Recent Trades</span>
      </div>
      <div className="grid grid-cols-3 px-2 text-[10px] text-text-muted">
        <span>Price</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            Waiting for trades...
          </div>
        ) : (
          trades.map((t, i) => (
            <div key={i} className="grid grid-cols-3 px-2 py-0.5 font-mono text-xs">
              <span className={t.side === "BUY" ? "text-green" : "text-red"}>
                {formatPrice(t.price)}
              </span>
              <span className="text-right text-text-secondary">{formatQty(t.quantity)}</span>
              <span className="text-right text-text-muted">
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
