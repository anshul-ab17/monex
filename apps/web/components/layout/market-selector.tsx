"use client";

import { useMarkets, type Market } from "@/hooks/use-markets";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MarketSelectorProps {
  selectedMarketId: string;
  onSelect: (market: Market) => void;
}

export function MarketSelector({ selectedMarketId, onSelect }: MarketSelectorProps) {
  const { data: markets } = useMarkets();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = markets?.find((m) => m.id === selectedMarketId);
  const label = selected
    ? `${selected.baseAsset.symbol}/${selected.quoteAsset.symbol}`
    : "Select Market";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-hover transition-colors cursor-pointer"
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && markets && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface shadow-lg">
          {markets.map((m) => (
            <button
              key={m.id}
              onClick={() => { onSelect(m); setOpen(false); }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-surface-hover transition-colors cursor-pointer",
                m.id === selectedMarketId && "text-accent font-semibold"
              )}
            >
              {m.baseAsset.symbol}/{m.quoteAsset.symbol}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
