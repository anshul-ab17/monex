"use client";

import { useDepth, type DepthLevel } from "@/hooks/use-depth";
import { useWebSocket } from "@/hooks/use-websocket";
import { formatPrice, formatQty } from "@/lib/utils";
import { useState, useCallback } from "react";
import { useTradingStore } from "@/stores/trading-store";

interface OrderBookProps {
  marketId: string;
}

function PriceRow({
  level,
  maxQty,
  side,
  onClick,
}: {
  level: DepthLevel;
  maxQty: number;
  side: "bid" | "ask";
  onClick: (price: string) => void;
}) {
  const pct = (Number(level.quantity) / maxQty) * 100;
  const color = side === "bid" ? "bg-green/10" : "bg-red/10";

  return (
    <button
      onClick={() => onClick(level.price)}
      className="relative grid w-full cursor-pointer grid-cols-2 px-2 py-0.5 text-right font-mono text-xs hover:bg-surface-hover transition-colors"
    >
      <div
        className={`absolute inset-y-0 right-0 ${color}`}
        style={{ width: `${pct}%` }}
      />
      <span className={`relative z-10 ${side === "bid" ? "text-green" : "text-red"}`}>
        {formatPrice(level.price)}
      </span>
      <span className="relative z-10 text-text-secondary">{formatQty(level.quantity)}</span>
    </button>
  );
}

export function OrderBook({ marketId }: OrderBookProps) {
  const { data: depth } = useDepth(marketId);
  const setOrderPrice = useTradingStore((s) => s.setOrderPrice);
  const [wsDepth, setWsDepth] = useState<{ bids: DepthLevel[]; asks: DepthLevel[] } | null>(null);

  useWebSocket(
    marketId ? `market:depth:${marketId}` : null,
    useCallback((data: unknown) => {
      const d = data as { bids: DepthLevel[]; asks: DepthLevel[] };
      if (d.bids && d.asks) setWsDepth(d);
    }, [])
  );

  const displayDepth = wsDepth || depth;
  if (!displayDepth) {
    return <div className="flex h-full items-center justify-center text-text-muted text-sm">Loading...</div>;
  }

  const asks = displayDepth.asks.slice(0, 12).reverse();
  const bids = displayDepth.bids.slice(0, 12);
  const allQtys = [...asks, ...bids].map((l) => Number(l.quantity));
  const maxQty = Math.max(...allQtys, 1);

  const spread =
    asks.length && bids.length
      ? (Number(asks[asks.length - 1]!.price) - Number(bids[0]!.price)).toFixed(2)
      : "—";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-semibold text-text-secondary">Order Book</span>
      </div>
      <div className="grid grid-cols-2 px-2 text-[10px] text-text-muted">
        <span className="text-right">Price</span>
        <span className="text-right">Qty</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col justify-end">
          {asks.map((a, i) => (
            <PriceRow key={`a-${i}`} level={a} maxQty={maxQty} side="ask" onClick={setOrderPrice} />
          ))}
        </div>
        <div className="border-y border-border px-2 py-1 text-center font-mono text-xs text-text-muted">
          Spread: {spread}
        </div>
        <div>
          {bids.map((b, i) => (
            <PriceRow key={`b-${i}`} level={b} maxQty={maxQty} side="bid" onClick={setOrderPrice} />
          ))}
        </div>
      </div>
    </div>
  );
}
