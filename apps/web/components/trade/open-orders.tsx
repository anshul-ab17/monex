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
      <div className="px-2 py-1">
        <span className="text-xs font-semibold text-text-secondary">Open Orders</span>
      </div>
      {!isAuthed ? (
        <div className="flex h-full items-center justify-center text-xs text-text-muted">
          Connect wallet to see orders
        </div>
      ) : openOrders.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-text-muted">
          No open orders
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[60px_1fr_1fr_1fr_32px] gap-1 px-2 text-[10px] text-text-muted">
            <span>Side</span>
            <span className="text-right">Price</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Filled</span>
            <span />
          </div>
          {openOrders.map((o: Order) => (
            <div
              key={o.id}
              className="grid grid-cols-[60px_1fr_1fr_1fr_32px] items-center gap-1 px-2 py-1 font-mono text-xs"
            >
              <span className={cn(o.side === "BUY" ? "text-green" : "text-red", "font-semibold")}>
                {o.side}
              </span>
              <span className="text-right text-text-primary">{formatPrice(o.price)}</span>
              <span className="text-right text-text-secondary">{formatQty(o.quantity)}</span>
              <span className="text-right text-text-secondary">{formatQty(o.filledQuantity)}</span>
              <button
                onClick={() => cancelOrder.mutate(o.id)}
                disabled={cancelOrder.isPending}
                className="flex items-center justify-center rounded p-1 text-text-muted hover:bg-red/10 hover:text-red transition-colors cursor-pointer"
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
