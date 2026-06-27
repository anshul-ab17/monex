"use client";

import { useOrders, type Order } from "@/hooks/use-orders";
import { formatPrice, formatQty } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "text-accent",
  PARTIALLY_FILLED: "text-yellow-400",
  FILLED: "text-green",
  CANCELLED: "text-text-muted",
  EXPIRED: "text-text-muted",
};

const FILTERS = ["ALL", "OPEN", "FILLED", "CANCELLED"] as const;

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders();
  const [filter, setFilter] = useState<string>("ALL");

  const filtered =
    orders?.filter(
      (o: Order) =>
        filter === "ALL" ||
        o.status === filter ||
        (filter === "OPEN" && o.status === "PARTIALLY_FILLED")
    ) ?? [];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Order History</h1>

      <div className="mt-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
              filter === f
                ? "bg-accent/10 text-accent"
                : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Filled</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-text-muted">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-text-muted">
                  No orders found
                </td>
              </tr>
            ) : (
              filtered.map((o: Order) => (
                <tr
                  key={o.id}
                  className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-sm font-semibold",
                      o.side === "BUY" ? "text-green" : "text-red"
                    )}
                  >
                    {o.side}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{o.type}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{formatPrice(o.price)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{formatQty(o.quantity)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-text-muted">
                    {formatQty(o.filledQuantity)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-xs font-medium",
                      STATUS_COLORS[o.status] || "text-text-muted"
                    )}
                  >
                    {o.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
