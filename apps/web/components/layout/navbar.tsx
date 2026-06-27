"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Wallet, ClipboardList } from "lucide-react";
import { WalletButton } from "./wallet-button";

const NAV_ITEMS = [
  { href: "/trade", label: "Trade", icon: BarChart3 },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/orders", label: "Orders", icon: ClipboardList },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center border-b border-border bg-surface px-4">
      <Link href="/" className="mr-8 text-lg font-bold text-text-primary">
        Monex
      </Link>
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href === "/trade" ? "/trade/sol-usdc" : href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              <Icon className="h-4 w-4" />
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
