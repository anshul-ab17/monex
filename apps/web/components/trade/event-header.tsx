interface EventHeaderProps {
  eventId: string;
}

type EventData = { question: string; resolution: string; yesProb: number };

const DEFAULT_EVENT: EventData = { question: "Event market", resolution: "TBD", yesProb: 50 };

const MOCK_EVENTS: Record<string, EventData> = {
  "trump-wins": {
    question: "Will Trump win the 2028 US Presidential Election?",
    resolution: "Nov 4, 2028",
    yesProb: 52,
  },
};

export function EventHeader({ eventId }: EventHeaderProps) {
  const event = MOCK_EVENTS[eventId] ?? DEFAULT_EVENT;

  return (
    <div className="flex h-14 items-center justify-between rounded-md bg-surface px-4">
      <div className="flex items-center gap-4">
        <span className="max-w-lg text-[14px] font-semibold text-text-primary">{event.question}</span>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
          <span className="text-[11px] text-text-muted">Resolves</span>
          <span className="text-[11px] font-medium text-text-secondary">{event.resolution}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-[11px] text-text-muted">Current</div>
          <div className="font-mono text-[16px] font-bold text-green">{event.yesProb}% YES</div>
        </div>
      </div>
    </div>
  );
}
