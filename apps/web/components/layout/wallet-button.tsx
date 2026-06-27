"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/hooks/use-auth";
import { shortenAddress } from "@/lib/utils";
import { LogOut } from "lucide-react";

export function WalletButton() {
  const { publicKey, connected } = useWallet();
  const { isAuthenticated, isLoggingIn, logout } = useAuth();

  if (!connected) {
    return <WalletMultiButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-lg bg-surface px-3 py-2 font-mono text-xs text-text-secondary">
        {isLoggingIn ? "Signing..." : publicKey ? shortenAddress(publicKey.toBase58()) : "..."}
      </span>
      {isAuthenticated && (
        <button
          onClick={logout}
          className="rounded-lg bg-surface p-2 text-text-muted hover:bg-surface-hover hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
