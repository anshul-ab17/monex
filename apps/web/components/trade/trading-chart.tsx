"use client";

import { useEffect, useRef, memo } from "react";

interface TradingChartProps {
  marketId: string;
}

function TradingChartInner({ marketId }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const symbol = marketId.replace("-", "").toUpperCase();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol}`,
      interval: "15",
      timezone: "Asia/Kolkata",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(30, 41, 59, 1)",
      gridColor: "rgba(51, 65, 85, 0.3)",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full w-full" />
    </div>
  );
}

export const TradingChart = memo(TradingChartInner);
