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
        ? `Clocked in at ${format(latestTimestamp, "h:mm a")}`
        : "Currently working"
      : "Not clocked in";

  if (successMessage) {
    return (
      <section
        aria-live="polite"
        className="rounded-xl border border-border bg-background px-6 py-10 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          {successMessage}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {nextAction === "IN"
            ? `Have a good shift, ${firstName}.`
            : `You&apos;re all done, ${firstName}.`}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-background p-6">
      <div className="mb-6">
        <p className="text-xs font-medium text-muted">Clock {nextAction === "IN" ? "in" : "out"}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{firstName}</h2>
        <p className="mt-1 text-sm text-muted">{currentStatusLabel}</p>
      </div>

      {timelogLoading ? (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking status...</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          aria-live="polite"
          className="mb-4 rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error"
        >
          {errorMessage}
        </div>
      ) : null}

      <button
        onClick={onConfirm}
        disabled={timelogLoading || actionLoading}
        className={`flex h-12 w-full items-center justify-center rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
          nextAction === "IN"
            ? "bg-primary hover:bg-primary-dark"
            : "bg-foreground hover:opacity-90"
        }`}
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : nextAction === "IN" ? (
          "Clock In"
        ) : (
          "Clock Out"
        )}
      </button>

      <button
        onClick={onBack}
        className="mt-4 inline-flex h-9 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <MoveLeft className="h-3.5 w-3.5" />
        Back
      </button>
    </section>
  );
}
