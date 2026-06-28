interface FundingRateBarProps {
  marketId: string;
}

export function FundingRateBar({ marketId: _ }: FundingRateBarProps) {
  return (
    <div className="flex items-center gap-4 border-l border-white/5 pl-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-muted">Funding</span>
        <span className="font-mono text-[12px] text-green">+0.0100%</span>
        <span className="text-[11px] text-text-muted">/ 8h</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-muted">Open Int.</span>
        <span className="font-mono text-[12px] text-text-secondary">$124.5M</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-muted">Index</span>
        <span className="font-mono text-[12px] text-text-secondary">—</span>
      </div>
    </div>
  );
}
