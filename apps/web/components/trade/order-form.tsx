"use client";

import { useTradingStore } from "@/stores/trading-store";
import { useCreateOrder } from "@/hooks/use-orders";
import { getAccessToken } from "@/lib/api";
import { cn } from "@/lib/utils";

interface OrderFormProps {
  marketId: string;
}

export function OrderForm({ marketId }: OrderFormProps) {
  const { orderSide, setOrderSide, orderPrice, setOrderPrice, orderQuantity, setOrderQuantity } =
    useTradingStore();
  const createOrder = useCreateOrder();
  const isAuthed = !!getAccessToken();

  const total =
    orderPrice && orderQuantity
      ? (Number(orderPrice) * Number(orderQuantity)).toFixed(2)
      : "0.00";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderPrice || !orderQuantity || !isAuthed) return;

    createOrder.mutate({
      marketId,
      side: orderSide,
      type: "LIMIT",
      price: orderPrice,
      quantity: orderQuantity,
      timeInForce: "GTC",
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-2">
        <span className="text-[12px] font-semibold text-text-primary">Place Order</span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Buy/Sell toggle */}
        <div className="flex gap-1 rounded-lg bg-background p-1">
          {(["BUY", "SELL"] as const).map((side) => (
            <button
              key={side}
              onClick={() => setOrderSide(side)}
              className={cn(
                "flex-1 rounded-md py-2 text-[13px] font-semibold transition-all cursor-pointer",
                orderSide === side
                  ? side === "BUY"
                    ? "bg-green text-white shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                    : "bg-red text-white shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {side === "BUY" ? "Buy / Long" : "Sell / Short"}
            </button>
          ))}
        </div>

        {/* Order type badge */}
        <div className="mt-4 mb-3">
          <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] font-medium text-text-muted">
            Limit
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3">
          {/* Price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-text-muted">Price</span>
              <span className="text-[11px] text-text-muted">USDC</span>
            </div>
            <input
              type="text"
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-white/5 bg-background px-3 py-2.5 font-mono text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-muted/50 focus:border-accent/50 focus:bg-background"
            />
          </div>

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-text-muted">Size</span>
              <span className="text-[11px] text-text-muted">SOL</span>
            </div>
            <input
              type="text"
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-white/5 bg-background px-3 py-2.5 font-mono text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-muted/50 focus:border-accent/50 focus:bg-background"
            />
          </div>

          {/* Percentage buttons */}
          <div className="flex gap-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                className="flex-1 rounded-md bg-white/[0.03] py-1 text-[11px] text-text-muted transition-colors hover:bg-white/[0.06] hover:text-text-secondary cursor-pointer"
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Total */}
          <div className="mt-1 flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
            <span className="text-[11px] text-text-muted">Total</span>
            <span className="font-mono text-[13px] text-text-primary">{total} USDC</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isAuthed || !orderPrice || !orderQuantity || createOrder.isPending}
            className={cn(
              "mt-auto rounded-lg py-3 text-[13px] font-bold text-white transition-all cursor-pointer",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
              orderSide === "BUY"
                ? "bg-green hover:bg-green/90 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                : "bg-red hover:bg-red/90 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            )}
          >
            {!isAuthed
              ? "Connect Wallet"
              : createOrder.isPending
                ? "Placing..."
                : orderSide === "BUY"
                  ? "Buy / Long"
                  : "Sell / Short"}
          </button>
        </form>
      </div>
    </div>
  );
}
