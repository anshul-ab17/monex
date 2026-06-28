import type { Metadata } from "next";
import localFont from "next/font/local";
import dynamic from "next/dynamic";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// ssr: false — @solana/web3.js does module-level init that crashes the RSC worker in Node.js
const Providers = dynamic(() => import("@/components/providers").then((m) => m.Providers), {
  ssr: false,
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Monex — Decentralized Exchange",
  description: "Trade crypto on Solana with speed and precision",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
