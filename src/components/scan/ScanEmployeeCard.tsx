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
      className="group flex min-h-[112px] w-full items-center justify-between rounded-[var(--radius-panel)] border border-surfacestroke bg-surface px-5 py-4 text-left shadow-[var(--shadow-panel)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="qr-grid-accent flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-border-strong bg-background text-lg font-bold text-foreground">
          {getInitials(employee.name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">
            {employee.name}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                isWorking
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-surfacestroke bg-background text-text-muted"
              }`}
            >
              <CircleDot className="h-3.5 w-3.5" />
              {isWorking ? "Working" : "Ready to clock in"}
            </span>
          </div>
        </div>
      </div>

      <ArrowRight className="h-5 w-5 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
