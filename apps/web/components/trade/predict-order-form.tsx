"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PredictOrderFormProps {
  eventId: string;
}

const YES_PROB = 52;

export function PredictOrderForm({ eventId: _ }: PredictOrderFormProps) {
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("");

  const prob = side === "YES" ? YES_PROB : 100 - YES_PROB;
  const amountNum = parseFloat(amount);
  const payout = isFinite(amountNum) && amountNum > 0 ? (amountNum / (prob / 100)).toFixed(2) : "—";
  const profit = isFinite(amountNum) && amountNum > 0 ? ((amountNum / (prob / 100)) - amountNum).toFixed(2) : "—";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 px-4 py-2">
        <span className="text-[12px] font-semibold text-text-primary">Place Bet</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* YES / NO toggle */}
        <div className="flex gap-1 rounded-lg bg-background p-1">
          {(["YES", "NO"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={cn(
                "flex-1 cursor-pointer rounded-md py-2 text-[13px] font-bold transition-all",
                side === s
                  ? s === "YES"
                    ? "bg-green text-background shadow-[0_0_12px_rgba(60,227,171,0.2)]"
                    : "bg-red text-white shadow-[0_0_12px_rgba(242,54,116,0.2)]"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Probability display */}
        <div className="rounded-lg bg-background px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Current Probability</span>
            <span className={cn("font-mono text-[14px] font-bold", side === "YES" ? "text-green" : "text-red")}>
              {prob}% {side}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Amount</span>
            <span className="text-[11px] text-text-muted">USDC</span>
          </div>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-white/5 bg-background px-3 py-2.5 font-mono text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-muted/50 focus:border-accent/50"
          />
        </div>

        {/* Payout rows */}
        <div className="flex flex-col gap-1.5 rounded-lg bg-background px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Potential Payout</span>
            <span className="font-mono text-[12px] text-text-secondary">{payout === "—" ? "—" : `$${payout}`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Potential Profit</span>
            <span className={cn("font-mono text-[12px]", profit === "—" ? "text-text-secondary" : "text-green")}>
              {profit === "—" ? "—" : `+$${profit}`}
            </span>
          </div>
        </div>

        {/* Stub submit */}
        <button
          type="button"
          disabled
          className="mt-auto cursor-not-allowed rounded-lg bg-surface py-3 text-[13px] font-bold text-text-muted opacity-60"
        >
          Predict Coming Soon
        </button>
      </div>
    </div>
  );
}
