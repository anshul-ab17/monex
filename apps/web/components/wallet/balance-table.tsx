"use client";

import { useBalances } from "@/hooks/use-balances";
import { formatQty } from "@/lib/utils";

export function BalanceTable() {
  const { data: balances, isLoading } = useBalances();

  if (isLoading) {
    return <div className="text-sm text-text-muted">Loading balances...</div>;
  }

  if (!balances || balances.length === 0) {
    return <div className="text-sm text-text-muted">No balances found. Deposit to get started.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-text-muted">
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium text-right">Available</th>
            <th className="px-4 py-3 font-medium text-right">Locked</th>
            <th className="px-4 py-3 font-medium text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((b) => (
            <tr key={b.assetId} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
              <td className="px-4 py-3 text-sm font-semibold">{b.asset.symbol}</td>
              <td className="px-4 py-3 text-right font-mono text-sm">{formatQty(b.available)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm text-text-muted">{formatQty(b.locked)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm">
                {formatQty(Number(b.available) + Number(b.locked))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
