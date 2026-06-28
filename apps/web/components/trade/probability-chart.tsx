interface ProbabilityChartProps {
  eventId: string;
}

export function ProbabilityChart({ eventId: _ }: ProbabilityChartProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-md bg-surface p-6">
      <p className="text-[12px] text-text-muted">Probability chart coming soon</p>
      {/* ponytail: static placeholder — replace with real time-series chart when predict backend ships */}
      <div className="w-full max-w-md">
        <div className="mb-2 flex justify-between text-[11px] text-text-muted">
          <span>100% YES</span>
          <span>0% YES</span>
        </div>
        <div className="h-1 w-full rounded-full bg-white/5">
          <div className="h-1 w-[52%] rounded-full bg-green opacity-60" />
        </div>
        <div className="mt-1 flex justify-center text-[11px] text-text-muted">
          <span>Current: 52% YES</span>
        </div>
      </div>
    </div>
  );
}
