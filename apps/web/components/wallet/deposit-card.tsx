"use client";

import { useQuery } from "@tanstack/react-query";
import { api, getAccessToken } from "@/lib/api";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function DepositCard() {
  const [copied, setCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ["deposit-address"],
    queryFn: () => api.get<{ address: string }>("/wallet/deposit-address"),
    enabled: !!getAccessToken(),
  });

  const address = data?.address;

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-primary">Deposit Address</h3>
      <p className="mt-1 text-xs text-text-muted">
        Send SOL or SPL tokens to this address. Deposits are auto-detected.
      </p>
      {address ? (
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 rounded-md bg-background px-3 py-2 font-mono text-xs text-text-secondary break-all">
            {address}
          </code>
          <button
            onClick={copyAddress}
            className="rounded-md bg-background p-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 text-green" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <div className="mt-3 text-xs text-text-muted">Connect wallet to see deposit address</div>
      )}
    </div>
  );
}
