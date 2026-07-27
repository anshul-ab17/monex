import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClientProviders } from "@/components/client-providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Reishi — Decentralized Exchange",
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
        <ClientProviders>
          <TooltipProvider>{children}</TooltipProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
