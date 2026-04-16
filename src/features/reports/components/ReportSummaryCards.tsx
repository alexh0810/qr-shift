"use client";

import { WorkspaceStatCard } from "@/components/manager/WorkspaceStatCard";

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
      <WorkspaceStatCard
        label={decimalLabel}
        value={`${totalHours.toFixed(2)} h`}
        description="Decimal-hour total for payroll review."
        className="bg-background shadow-none"
        compact
        valueClassName="text-[clamp(1.75rem,3vw,2.25rem)]"
      />
      <WorkspaceStatCard
        label="Total Time"
        value={durationLabel}
        description="Readable duration from the same edited rows."
        className="bg-background shadow-none"
        compact
        valueClassName="text-[clamp(1.75rem,3vw,2.25rem)]"
      />
    </div>
  );
}
