"use client";

import { useEffect, useRef } from "react";

interface TradingChartProps {
  marketId: string;
}

export function TradingChart({ marketId }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);

  const symbol = marketId.replace("-", "").toUpperCase();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== "undefined") {
        widgetRef.current = new (window as any).TradingView.widget({
          container_id: containerRef.current!.id,
          symbol: `BINANCE:${symbol}`,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1E293B",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          width: "100%",
          height: "100%",
          backgroundColor: "#1E293B",
          gridColor: "#334155",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [symbol]);

  return (
    <div className="h-full w-full">
      <div id={`tv-chart-${marketId}`} ref={containerRef} className="h-full w-full" />
    </div>
  );
}
