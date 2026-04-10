"use client";

interface ReportSummaryCardsProps {
  totalHours: number;
  durationLabel: string;
  decimalLabel?: string;
}

export function ReportSummaryCards({
  totalHours,
  durationLabel,
  decimalLabel = "Total Decimal",
}: ReportSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-[22px] border border-surfacestroke bg-background px-4 py-4 shadow-[var(--shadow-panel)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
          {decimalLabel}
        </p>
        <p className="mt-3 font-mono-brand text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-[-0.04em] text-foreground">
          {totalHours.toFixed(2)} h
        </p>
      </div>
      <div className="rounded-[22px] border border-surfacestroke bg-background px-4 py-4 shadow-[var(--shadow-panel)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
          Total Time
        </p>
        <p className="mt-3 font-mono-brand text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-[-0.04em] text-foreground">
          {durationLabel}
        </p>
      </div>
    </div>
  );
}
