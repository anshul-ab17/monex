"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const LEVERAGE_MARKS = [1, 5, 10, 25, 50, 100];

const EXPIRIES = [
  { label: "Sep 26 2026", value: "2026-09-26" },
  { label: "Dec 26 2026", value: "2026-12-26" },
  { label: "Mar 27 2027", value: "2027-03-27" },
] as const;

interface FuturesOrderFormProps {
  marketId: string;
}

export function FuturesOrderForm({ marketId: _ }: FuturesOrderFormProps) {
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");
  const [leverage, setLeverage] = useState(10);
  const [margin, setMargin] = useState<"Cross" | "Isolated">("Cross");
  const [collateral, setCollateral] = useState("");
  const [expiry, setExpiry] = useState<(typeof EXPIRIES)[number]["value"]>(EXPIRIES[0].value);

  const selectedExpiry = EXPIRIES.find((e) => e.value === expiry)!;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 px-4 py-2">
        <span className="text-[12px] font-semibold text-text-primary">Place Order</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {/* Expiry selector */}
        <div>
          <span className="mb-1.5 block text-[11px] text-text-muted">Contract Expiry</span>
          <div className="flex gap-1">
            {EXPIRIES.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => setExpiry(e.value)}
                className={cn(
                  "flex-1 cursor-pointer rounded-md py-1.5 text-[10px] font-medium transition-colors",
                  expiry === e.value
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-white/[0.03] text-text-muted hover:bg-white/[0.06] border border-transparent"
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Long / Short */}
        <div className="flex gap-1 rounded-lg bg-background p-1">
          {(["LONG", "SHORT"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={cn(
                "flex-1 cursor-pointer rounded-md py-2 text-[13px] font-semibold transition-all",
                side === s
                  ? s === "LONG"
                    ? "bg-green text-background shadow-[0_0_12px_rgba(60,227,171,0.2)]"
                    : "bg-red text-white shadow-[0_0_12px_rgba(242,54,116,0.2)]"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {s === "LONG" ? "Long" : "Short"}
            </button>
          ))}
        </div>

        {/* Cross / Isolated */}
        <div className="flex gap-1 rounded-md bg-background p-0.5">
          {(["Cross", "Isolated"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMargin(m)}
              className={cn(
                "flex-1 cursor-pointer rounded py-1 text-[11px] font-medium transition-colors",
                margin === m
                  ? "bg-surface text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Leverage slider */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Leverage</span>
            <span className="font-mono text-[13px] font-semibold text-text-primary">{leverage}×</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full accent-[#3CE3AB]"
          />
          <div className="mt-1 flex justify-between">
            {LEVERAGE_MARKS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLeverage(m)}
                className="cursor-pointer text-[10px] text-text-muted hover:text-text-secondary"
              >
                {m}×
              </button>
            ))}
          </div>
        </div>

        {/* Collateral */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Collateral</span>
            <span className="text-[11px] text-text-muted">USDC</span>
          </div>
          <input
            type="text"
            value={collateral}
            onChange={(e) => setCollateral(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-white/5 bg-background px-3 py-2.5 font-mono text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-muted/50 focus:border-accent/50"
          />
        </div>

        {/* Info rows */}
        <div className="flex flex-col gap-1.5 rounded-lg bg-background px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Settlement</span>
            <span className="font-mono text-[12px] text-text-secondary">{selectedExpiry.label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Entry Price</span>
            <span className="font-mono text-[12px] text-text-secondary">Market</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Position Size</span>
            <span className="font-mono text-[12px] text-text-secondary">
              {collateral ? `$${(Number(collateral) * leverage).toFixed(2)}` : "—"}
            </span>
          </div>
        </div>

        {/* ponytail: stub submit — disabled until futures engine ships */}
        <button
          type="button"
          disabled
          className="mt-auto cursor-not-allowed rounded-lg bg-surface py-3 text-[13px] font-bold text-text-muted opacity-60"
        >
          Futures Coming Soon
        </button>
      </div>
    </div>
  );
}
