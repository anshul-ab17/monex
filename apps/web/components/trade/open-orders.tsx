"use client";

import { useOrders, useCancelOrder, type Order } from "@/hooks/use-orders";
import { formatPrice, formatQty, cn } from "@/lib/utils";
import { X } from "lucide-react";
import { getAccessToken } from "@/lib/api";

export function OpenOrders({ marketId }: { marketId: string }) {
  const { data: orders } = useOrders();
  const cancelOrder = useCancelOrder();
  const isAuthed = !!getAccessToken();

  const openOrders =
    orders?.filter(
      (o: Order) =>
        o.marketId === marketId &&
        (o.status === "OPEN" || o.status === "PARTIALLY_FILLED")
    ) ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-white/5 px-4 py-2">
        <span className="text-[12px] font-semibold text-text-primary">Open Orders</span>
        {openOrders.length > 0 && (
          <span className="ml-2 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
            {openOrders.length}
          </span>
        )}
      </div>
      {!isAuthed ? (
        <div className="flex h-full items-center justify-center text-[12px] text-text-muted">
          Connect wallet to view orders
        </div>
      ) : openOrders.length === 0 ? (
        <div className="flex h-full items-center justify-center text-[12px] text-text-muted">
          No open orders
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 grid grid-cols-[60px_1fr_1fr_1fr_1fr_32px] gap-2 bg-surface px-4 py-1.5 text-[10px] uppercase tracking-wider text-text-muted">
            <span>Side</span>
            <span className="text-right">Type</span>
            <span className="text-right">Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Filled</span>
            <span />
          </div>
          {openOrders.map((o: Order) => (
            <div
              key={o.id}
              className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_32px] items-center gap-2 px-4 py-1.5 font-mono text-[12px] transition-colors hover:bg-white/[0.02]"
            >
              <span className={cn("font-semibold", o.side === "BUY" ? "text-green" : "text-red")}>
                {o.side}
              </span>
              <span className="text-right text-text-muted">{o.type}</span>
              <span className="text-right text-text-primary">{formatPrice(o.price)}</span>
              <span className="text-right text-text-secondary">{formatQty(o.quantity)}</span>
              <span className="text-right text-text-secondary">{formatQty(o.filledQuantity)}</span>
              <button
                onClick={() => cancelOrder.mutate(o.id)}
                disabled={cancelOrder.isPending}
                className="flex items-center justify-center rounded p-1 text-text-muted transition-colors hover:bg-red/10 hover:text-red cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
