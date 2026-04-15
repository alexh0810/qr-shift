"use client";

import { format } from "date-fns";
import { CheckCircle2, Loader2, MoveLeft } from "lucide-react";

interface ScanActionPanelProps {
  employeeName: string;
  nextAction: "IN" | "OUT";
  latestTimestamp: Date | null;
  timelogLoading: boolean;
  actionLoading: boolean;
  successMessage: string | null;
  errorMessage?: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

function getFirstName(name: string) {
  return name.split(" ").filter(Boolean)[0] ?? name;
}

export function ScanActionPanel({
  employeeName,
  nextAction,
  latestTimestamp,
  timelogLoading,
  actionLoading,
  successMessage,
  errorMessage = null,
  onBack,
  onConfirm,
}: ScanActionPanelProps) {
  const firstName = getFirstName(employeeName);
  const currentStatusLabel =
    nextAction === "OUT"
      ? latestTimestamp
        ? `Clocked in since ${format(latestTimestamp, "hh:mm a")}`
        : "Working right now"
      : "Clocked out right now";

  if (successMessage) {
    return (
      <section
        aria-live="polite"
        className="rounded-[var(--radius-panel)] border border-secondary/30 bg-surface px-6 py-10 text-center shadow-[var(--shadow-panel)]"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <CheckCircle2 className="h-10 w-10" strokeWidth={2.5} />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-secondary">
          QRShift updated
        </p>
        <h2 className="mt-6 font-display text-3xl font-bold tracking-[-0.04em] text-foreground">
          {successMessage}
        </h2>
        <p className="mt-3 text-sm font-medium text-text-muted">
          {nextAction === "IN"
            ? `Have a good shift, ${firstName}.`
            : `You're all set, ${firstName}. You can step away from the clock station.`}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-panel)] border border-border-strong bg-surface p-6 shadow-[var(--shadow-panel)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
            Selected employee
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-foreground">
            {firstName}
          </h2>
          <p className="mt-2 text-sm font-medium text-text-muted">
            Review the current status, then confirm the next clock action.
          </p>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
            nextAction === "OUT"
              ? "border-secondary/25 bg-secondary/10 text-secondary"
              : "border-surfacestroke bg-background text-text-muted"
          }`}
        >
          {nextAction === "OUT" ? "Working" : "Off shift"}
        </span>
      </div>

      <div className="mt-4 rounded-[20px] border border-primary/10 bg-primary/5 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
          Next action
        </p>
        <p className="mt-2 text-base font-bold text-foreground">
          {nextAction === "IN"
            ? "Clock in to start this shift."
            : "Clock out to end this shift."}
        </p>
      </div>

      <div className="mt-6 rounded-[20px] border border-surfacestroke bg-background px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
          Current status
        </p>
        {timelogLoading ? (
          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking latest shift activity...
          </div>
        ) : (
          <p className="mt-3 text-base font-bold text-foreground">
            {currentStatusLabel}
          </p>
        )}
      </div>

      {errorMessage ? (
        <div
          aria-live="polite"
          className="mt-4 rounded-[20px] border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error"
        >
          {errorMessage}
        </div>
      ) : null}

      <button
        onClick={onConfirm}
        disabled={timelogLoading || actionLoading}
        className={`mt-6 flex min-h-[56px] w-full items-center justify-center rounded-[var(--radius-control)] px-4 py-4 text-base font-bold uppercase tracking-[0.18em] text-white transition-colors ${
          timelogLoading || actionLoading
            ? "cursor-not-allowed bg-primary/60"
            : nextAction === "IN"
              ? "bg-primary hover:bg-primary-dark"
              : "bg-foreground hover:bg-slate-800 dark:hover:bg-slate-200 dark:hover:text-slate-900"
        }`}
      >
        {actionLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          nextAction === "IN" ? "Clock In Now" : "Clock Out Now"
        )}
      </button>

      <button
        onClick={onBack}
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-text-muted transition-colors hover:text-foreground"
      >
        <MoveLeft className="h-4 w-4" />
        Choose a different name
      </button>
    </section>
  );
}
