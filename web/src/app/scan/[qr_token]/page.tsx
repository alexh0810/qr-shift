"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Loader2, QrCode } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { ScanActionPanel } from "@/components/scan/ScanActionPanel";
import { ScanEmployeeCard } from "@/components/scan/ScanEmployeeCard";
import { getScanRoster, submitClockAction } from "@/lib/client-api";
import { PublicStore, ScanEmployeeStatus } from "@/types";

export default function ScanPage({ params }: { params: { qr_token: string } }) {
  const [store, setStore] = useState<PublicStore | null>(null);
  const [employees, setEmployees] = useState<ScanEmployeeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<ScanEmployeeStatus | null>(null);
  const [timelogLoading, setTimelogLoading] = useState(false);
  const [nextAction, setNextAction] = useState<"IN" | "OUT" | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearSelection = () => {
    setSelectedEmployee(null);
    setNextAction(null);
    setError(null);
  };

  const retryPageLoad = () => {
    setLoading(true);
    setError(null);
    setSelectedEmployee(null);
    setSuccessMessage(null);
    window.location.reload();
  };

  const loadRoster = useCallback(async () => {
    const roster = await getScanRoster(params.qr_token);
    setStore(roster.store);
    setEmployees(roster.employees);
  }, [params.qr_token]);

  useEffect(() => {
    loadRoster()
      .catch(() => {
        setError(
          "QRShift couldn't load this store right now. Refresh the page and try again. If the issue continues, reopen the QR link.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadRoster]);

  const handleSelectEmployee = async (employeeStatus: ScanEmployeeStatus) => {
    setSelectedEmployee(employeeStatus);
    setTimelogLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      setNextAction(employeeStatus.latestLog?.type === "IN" ? "OUT" : "IN");
    } catch {
      setError("QRShift couldn't read the latest shift status. Go back and try again.");
    } finally {
      setTimelogLoading(false);
    }
  };

  const handleClockAction = async () => {
    if (!selectedEmployee || !nextAction) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await submitClockAction(params.qr_token, selectedEmployee.employee.id, nextAction);
      setSuccessMessage(`Clocked ${nextAction === "IN" ? "in" : "out"}`);

      window.setTimeout(() => {
        setSuccessMessage(null);
        clearSelection();
        loadRoster().catch(() => {
          setError("QRShift couldn't refresh the clock station. Try again.");
        });
      }, 2500);
    } catch {
      setError("QRShift couldn't save that clock action. Try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex w-full max-w-md flex-col items-center rounded-[var(--radius-panel)] border border-border-strong bg-surface px-6 py-10 text-center shadow-[var(--shadow-panel)]">
          <BrandMark />
          <Loader2 className="mt-4 h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium text-text-muted">Loading clock station...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-5 pb-12">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <header className="overflow-hidden rounded-[var(--radius-panel)] border border-border-strong bg-surface shadow-[var(--shadow-panel)]">
          <div className="px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <BrandMark />
              <div className="qr-grid-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-surfacestroke bg-background text-primary">
                <QrCode className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5">
              <h1 className="mt-2 font-display text-[2rem] font-bold tracking-[-0.04em] text-foreground">
                Clock in or out
              </h1>
              <p className="mt-3 text-sm font-medium text-text-muted">
                {store?.name ?? "QRShift"} clock station
              </p>
            </div>
          </div>
        </header>

        {!selectedEmployee && error ? (
          <div
            aria-live="polite"
            className="rounded-[20px] border border-error/20 bg-error/10 px-4 py-4 text-sm font-medium text-error"
          >
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p>{error}</p>
                <button
                  onClick={retryPageLoad}
                  className="inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-[var(--radius-control)] border border-error/20 bg-surface px-4 text-sm font-bold text-error transition-colors hover:bg-error/5"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {selectedEmployee ? (
          <ScanActionPanel
            employeeName={selectedEmployee.employee.name}
            nextAction={nextAction ?? "IN"}
            latestTimestamp={selectedEmployee.latestLog?.timestamp ?? null}
            timelogLoading={timelogLoading}
            actionLoading={actionLoading}
            successMessage={successMessage}
            errorMessage={error}
            onBack={clearSelection}
            onConfirm={handleClockAction}
          />
        ) : employees.length === 0 ? (
          <div className="rounded-[var(--radius-panel)] border border-surfacestroke bg-surface px-5 py-10 text-center shadow-[var(--shadow-panel)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Scan roster</p>
            <p className="mt-3 font-display text-2xl font-bold tracking-[-0.04em] text-foreground">
              No employees found.
            </p>
            <p className="mt-2 text-sm font-medium text-text-muted">
              Ask your manager to add employees, then reopen this QR link.
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            <div className="rounded-[20px] border border-surfacestroke bg-surface px-4 py-4 shadow-[var(--shadow-panel)]">
              <p className="text-sm font-medium text-foreground">Choose your name.</p>
            </div>
            {employees.map((entry) => (
              <ScanEmployeeCard key={entry.employee.id} entry={entry} onSelect={handleSelectEmployee} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
