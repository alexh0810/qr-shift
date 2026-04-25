"use client";

import { ArrowRight, CircleDot } from "lucide-react";

import { ScanEmployeeStatus } from "@/types";

interface ScanEmployeeCardProps {
  entry: ScanEmployeeStatus;
  onSelect: (entry: ScanEmployeeStatus) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ScanEmployeeCard({ entry, onSelect }: ScanEmployeeCardProps) {
  const isWorking = entry.status === "IN";

  return (
    <button
      onClick={() => onSelect(entry)}
      className="group flex min-h-[112px] w-full items-center justify-between rounded-[var(--radius-panel)] border border-border-strong bg-surface px-5 py-4 text-left shadow-[var(--shadow-panel)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="qr-grid-accent flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-border-strong bg-background text-lg font-bold text-foreground">
          {getInitials(entry.employee.name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">{entry.employee.name}</p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                isWorking
                  ? "border-secondary/25 bg-secondary/10 text-secondary"
                  : "border-surfacestroke bg-background text-text-muted"
              }`}
            >
              <CircleDot className="h-3.5 w-3.5" />
              {isWorking ? "Working now" : "Ready to clock in"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-start pt-1 text-text-muted">
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
