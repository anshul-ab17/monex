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
    <div className="flex h-full flex-col p-3">
      <div className="mb-3 flex rounded-lg bg-background p-0.5">
        {(["BUY", "SELL"] as const).map((side) => (
          <button
            key={side}
            onClick={() => setOrderSide(side)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors cursor-pointer",
              orderSide === side
                ? side === "BUY"
                  ? "bg-green text-white"
                  : "bg-red text-white"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {side}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3">
        <label className="text-xs text-text-muted">
          Price
          <input
            type="text"
            value={orderPrice}
            onChange={(e) => setOrderPrice(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
        </label>

        <label className="text-xs text-text-muted">
          Quantity
          <input
            type="text"
            value={orderQuantity}
            onChange={(e) => setOrderQuantity(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
        </label>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Total</span>
          <span className="font-mono text-text-primary">{total}</span>
        </div>

        <button
          type="submit"
          disabled={!isAuthed || !orderPrice || !orderQuantity || createOrder.isPending}
          className={cn(
            "mt-auto rounded-lg py-3 text-sm font-bold text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            orderSide === "BUY" ? "bg-green hover:bg-green/90" : "bg-red hover:bg-red/90"
          )}
        >
          {!isAuthed
            ? "Connect Wallet"
            : createOrder.isPending
              ? "Placing..."
              : `${orderSide === "BUY" ? "Buy" : "Sell"}`}
        </button>
      </form>
    </div>
  );
}
