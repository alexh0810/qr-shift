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
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-surfacestroke bg-background/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
          {decimalLabel}
        </p>
        <p className="mt-2 text-2xl font-bold text-foreground">{totalHours.toFixed(2)} h</p>
      </div>
      <div className="rounded-2xl border border-surfacestroke bg-background/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
          Total Time
        </p>
        <p className="mt-2 text-2xl font-bold text-foreground">{durationLabel}</p>
      </div>
    </div>
  );
}
