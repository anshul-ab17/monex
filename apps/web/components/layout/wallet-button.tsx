"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/hooks/use-auth";
import { shortenAddress } from "@/lib/utils";
import { LogOut, Circle } from "lucide-react";

export function WalletButton() {
  const { publicKey, connected } = useWallet();
  const { isAuthenticated, isLoggingIn, logout } = useAuth();

  if (!connected) {
    return (
      <WalletMultiButton
        style={{
          background: "#8B5CF6",
          borderRadius: "8px",
          fontSize: "13px",
          height: "32px",
          padding: "0 14px",
          fontWeight: 600,
        }}
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5">
        <Circle className="h-2 w-2 fill-green text-green" />
        <span className="font-mono text-[12px] text-text-secondary">
          {isLoggingIn ? "Signing..." : publicKey ? shortenAddress(publicKey.toBase58()) : "..."}
        </span>
      </div>
      {isAuthenticated && (
        <button
          onClick={logout}
          className="rounded-lg border border-white/5 bg-white/[0.03] p-1.5 text-text-muted transition-colors hover:bg-red/10 hover:text-red hover:border-red/20 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
