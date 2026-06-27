"use client";

import { BalanceTable } from "@/components/wallet/balance-table";
import { DepositCard } from "@/components/wallet/deposit-card";

export default function WalletPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Wallet</h1>
      <div className="mt-6 space-y-6">
        <DepositCard />
        <BalanceTable />
      </div>
    </div>
  );
}
