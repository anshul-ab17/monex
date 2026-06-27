import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text-primary">Monex</h1>
        <p className="mt-2 text-text-secondary">Decentralized Exchange on Solana</p>
        <Link
          href="/trade/sol-usdc"
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover transition-colors"
        >
          Start Trading
        </Link>
      </div>
    </div>
  );
}
