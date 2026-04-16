"use client";

import { Employee } from "@/types";
import { ArrowRight, CircleDot } from "lucide-react";

interface ScanEmployeeCardProps {
  employee: Employee;
  status: "IN" | "OUT";
  onSelect: (employee: Employee) => void;
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

export function ScanEmployeeCard({
  employee,
  status,
  onSelect,
}: ScanEmployeeCardProps) {
  const isWorking = status === "IN";

  return (
    <button
      onClick={() => onSelect(employee)}
      className="group flex min-h-[112px] w-full items-center justify-between rounded-[var(--radius-panel)] border border-border-strong bg-surface px-5 py-4 text-left shadow-[var(--shadow-panel)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="qr-grid-accent flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-border-strong bg-background text-lg font-bold text-foreground">
          {getInitials(employee.name)}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-muted">
            Scan employee
          </p>
          <p className="truncate text-lg font-bold text-foreground">
            {employee.name}
          </p>
          <p className="mt-1 text-sm font-medium text-text-muted">
            {isWorking
              ? "Currently clocked in and ready for clock out."
              : "Currently clocked out and ready for clock in."}
          </p>
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

      <div className="flex shrink-0 items-center gap-2 text-text-muted">
        <span className="hidden text-xs font-bold uppercase tracking-[0.18em] sm:inline">
          Select
        </span>
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
