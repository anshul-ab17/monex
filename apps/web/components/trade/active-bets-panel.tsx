interface ActiveBetsPanelProps {
  eventId: string;
}

export function ActiveBetsPanel({ eventId: _ }: ActiveBetsPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 px-4 py-2">
        <div className="flex gap-4">
          {(["Active Bets", "Settled"] as const).map((tab) => (
            <span
              key={tab}
              className={
                tab === "Active Bets"
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
        <span className="text-[13px] text-text-muted">No active bets</span>
      </div>
    </div>
  );
}
