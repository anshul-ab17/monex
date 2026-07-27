"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wallet, ClipboardList } from "lucide-react";
import { WalletButton } from "./wallet-button";
import { Logo } from "./logo";

const VERTICALS = [
  { href: "/trade/spot/sol-usdc",      label: "Spot",    match: "/trade/spot" },
  { href: "/trade/futures/sol-usdc",   label: "Futures", match: "/trade/futures" },
  { href: "/trade/perps/sol-usdc",     label: "Perps",   match: "/trade/perps" },
  { href: "/trade/predict/trump-wins", label: "Predict", match: "/trade/predict" },
] as const;

const UTIL_ITEMS = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/orders", label: "Orders", icon: ClipboardList },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="flex h-12 items-center border-b border-border bg-surface px-4">
      <Logo href="/" className="mr-6" />

      <nav className="flex items-center gap-1">
        {VERTICALS.map(({ href, label, match }) => {
          const active = pathname.startsWith(match);
          return (
            <Link
              key={match}
              href={href}
              className={cn(
                "flex items-center px-3 py-3 text-[13px] font-medium transition-colors border-b-2",
                active
                  ? "border-accent text-text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              )}
            >
              {label}
            </Link>
          );
        })}

        <div className="mx-2 h-4 w-px bg-border" />

        {UTIL_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto">
        <WalletButton />
      </div>
    </header>
  );
}
