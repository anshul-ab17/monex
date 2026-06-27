import Link from "next/link";
import { ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second order matching with our custom B+ Tree engine",
  },
  {
    icon: Shield,
    title: "Non-Custodial",
    description: "Your keys, your crypto. Trade directly from your Solana wallet",
  },
  {
    icon: BarChart3,
    title: "Deep Liquidity",
    description: "Real-time orderbook with professional-grade trading tools",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-xl font-bold text-text-primary">Monex</span>
        <Link
          href="/trade/sol-usdc"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
        >
          Launch App
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-text-primary">
          Trade on Solana.
          <br />
          <span className="text-accent">No compromises.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-text-secondary">
          A decentralized exchange built for speed — matching engine with O(log n)
          price lookup and O(1) order execution.
        </p>
        <Link
          href="/trade/sol-usdc"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-bold text-white hover:bg-accent-hover transition-colors"
        >
          Start Trading <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="border-t border-border px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-lg border border-border bg-surface p-6">
              <Icon className="h-8 w-8 text-accent" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-text-muted">
        Monex — Decentralized Exchange on Solana
      </footer>
    </div>
  );
}
