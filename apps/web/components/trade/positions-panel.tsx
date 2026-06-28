interface PositionsPanelProps {
  marketId: string;
}

export function PositionsPanel({ marketId: _ }: PositionsPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 px-4 py-2">
        <div className="flex gap-4">
          {(["Positions", "Open Orders", "Order History"] as const).map((tab) => (
            <span
              key={tab}
              className={
                tab === "Positions"
                  ? "text-[12px] font-semibold text-text-primary border-b-2 border-accent pb-2"
                  : "text-[12px] font-medium text-text-muted pb-2"
              }
            >
              {tab}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <span className="text-[13px] text-text-muted">No open positions</span>
      </div>
    </div>
  );
}
