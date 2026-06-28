import Link from "next/link";
import { ArrowRight, Zap, Shield, BarChart3, TrendingUp } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Sub-millisecond Matching",
    description: "B+ Tree orderbook with O(log n) price discovery and O(1) order execution.",
  },
  {
    icon: Shield,
    title: "Non-Custodial",
    description: "Trade directly from your Solana wallet. Your keys, your crypto.",
  },
  {
    icon: BarChart3,
    title: "Professional Orderbook",
    description: "Real-time depth, live trades, and TradingView charts for serious traders.",
  },
] as const;

const STATS = [
  { value: "<1ms", label: "Matching Latency" },
  { value: "O(log n)", label: "Price Lookup" },
  { value: "0%", label: "Maker Fees" },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <span className="text-sm font-black text-white">M</span>
          </div>
          <span className="text-sm font-bold tracking-wide text-text-primary">MONEX</span>
        </div>
        <Link
          href="/trade/sol-usdc"
          className="rounded-lg bg-accent px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
        >
          Launch App
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-green" />
          <span className="text-[12px] text-text-secondary">Built on Solana</span>
        </div>
        <h1 className="max-w-2xl text-[56px] font-bold leading-[1.1] tracking-tight text-text-primary">
          Trade on Solana.
          <br />
          <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
            No compromises.
          </span>
        </h1>
        <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-text-secondary">
          A decentralized exchange engineered for speed — custom matching engine
          with O(log n) price lookup and O(1) order execution.
        </p>
        <Link
          href="/trade/sol-usdc"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(139,92,246,0.25)]"
        >
          Start Trading <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Stats */}
        <div className="mt-16 flex gap-12">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-mono text-2xl font-bold text-text-primary">{value}</div>
              <div className="mt-1 text-[12px] text-text-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 px-8 py-20">
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-6 text-center text-[12px] text-text-muted">
        Monex — Decentralized Exchange on Solana
      </footer>
    </div>
  );
}
