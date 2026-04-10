"use client";

import { useEffect, useState } from "react";
import { getStoreByQrToken, getEmployeesByStoreId, getLatestTimelog, addTimelog } from "@/lib/db";
import { Store, Employee, Timelog } from "@/types";
import { BrandMark } from "@/components/BrandMark";
import { ScanEmployeeCard } from "@/components/scan/ScanEmployeeCard";
import { ScanActionPanel } from "@/components/scan/ScanActionPanel";
import { CircleAlert, Loader2 } from "lucide-react";

export default function ScanPage({ params }: { params: { qr_token: string } }) {
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [timelogLoading, setTimelogLoading] = useState(false);
  const [nextAction, setNextAction] = useState<"IN" | "OUT" | null>(null);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [employeeStatuses, setEmployeeStatuses] = useState<Record<string, "IN" | "OUT"> | null>(null);
  const [selectedEmpLatestLog, setSelectedEmpLatestLog] = useState<Timelog | null>(null);

  const clearSelection = () => {
    setSelectedEmployee(null);
    setNextAction(null);
    setSelectedEmpLatestLog(null);
    setError(null);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const foundStore = await getStoreByQrToken(params.qr_token);
        if (!foundStore) {
          setError("QRShift couldn't load this store right now. Refresh the page and try again. If the issue continues, reopen the QR link.");
          setLoading(false);
          return;
        }
        setStore(foundStore);
        
        const storeEmployees = await getEmployeesByStoreId(foundStore.id);
        setEmployees(storeEmployees);

        // Fetch initial statuses for all employees
        const statusMap: Record<string, "IN" | "OUT"> = {};
        await Promise.all(
          storeEmployees.map(async (emp) => {
            const latest = await getLatestTimelog(emp.id);
            statusMap[emp.id] = (latest?.type === "IN") ? "IN" : "OUT";
          })
        );
        setEmployeeStatuses(statusMap);

      } catch {
        setError("QRShift couldn't load this store right now. Refresh the page and try again. If the issue continues, reopen the QR link.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
    localStorage.setItem("last_scan_token", params.qr_token);
  }, [params.qr_token]);

  const refreshStatuses = async () => {
    if (!store) return;
    const statusMap: Record<string, "IN" | "OUT"> = {};
    const storeEmployees = await getEmployeesByStoreId(store.id);
    await Promise.all(
      storeEmployees.map(async (emp) => {
        const latest = await getLatestTimelog(emp.id);
        statusMap[emp.id] = (latest?.type === "IN") ? "IN" : "OUT";
      })
    );
    setEmployeeStatuses(statusMap);
  };

  const handleSelectEmployee = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setTimelogLoading(true);
    setSuccessMessage(null);
    setError(null);
    try {
      const latest = await getLatestTimelog(employee.id);
      setSelectedEmpLatestLog(latest);
      if (!latest || latest.type === "OUT") {
        setNextAction("IN");
      } else {
        setNextAction("OUT");
      }
    } catch {
      setError("QRShift couldn't read the latest shift status. Go back and try again.");
    } finally {
      setTimelogLoading(false);
    }
  };

  const handleClockAction = async () => {
    if (!selectedEmployee || !store || !nextAction) return;

    // TODO (Future): Implement PIN prompt verification here before proceeding.
    
    setActionLoading(true);
    setError(null);
    try {
      await addTimelog(selectedEmployee.id, store.id, nextAction);
      setSuccessMessage(`Clocked ${nextAction === "IN" ? "in" : "out"}`);
      
      // Update local state immediately
      if (employeeStatuses) {
        setEmployeeStatuses({
          ...employeeStatuses,
          [selectedEmployee.id]: nextAction
        });
      }

      // Auto-refresh back to list after 2.5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        clearSelection();
        refreshStatuses(); // Fallback to full refresh
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
        <div className="flex w-full max-w-md flex-col items-center rounded-[var(--radius-panel)] border border-surfacestroke bg-surface px-6 py-10 text-center shadow-[var(--shadow-panel)]">
          <BrandMark showWordmark={false} />
          <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium text-text-muted">
            Loading your QRShift clock screen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-5 pb-12">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <header className="rounded-[var(--radius-panel)] border border-border-strong bg-surface px-5 py-6 shadow-[var(--shadow-panel)]">
          <BrandMark />
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-text-muted">
              Scan to clock in or out
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-foreground">
              {store?.name ?? "QRShift"}
            </h1>
            <p className="mt-2 text-sm font-medium text-text-muted">
              Choose your name, check your current status, then confirm your next action.
            </p>
          </div>
        </header>

        {!selectedEmployee && error ? (
          <div className="rounded-[20px] border border-error/20 bg-error/10 px-4 py-4 text-sm font-medium text-error">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        ) : null}

        {selectedEmployee ? (
          <ScanActionPanel
            employeeName={selectedEmployee.name}
            nextAction={nextAction ?? "IN"}
            latestTimestamp={selectedEmpLatestLog?.timestamp ?? null}
            timelogLoading={timelogLoading}
            actionLoading={actionLoading}
            successMessage={successMessage}
            errorMessage={error}
            onBack={clearSelection}
            onConfirm={handleClockAction}
          />
        ) : employees.length === 0 ? (
          <div className="rounded-[var(--radius-panel)] border border-surfacestroke bg-surface px-5 py-10 text-center shadow-[var(--shadow-panel)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
              Scan roster
            </p>
            <p className="mt-3 font-display text-2xl font-bold tracking-[-0.04em] text-foreground">
              No employees found for this store.
            </p>
            <p className="mt-2 text-sm font-medium text-text-muted">
              Ask your manager to add employees, then reopen this QR link.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {employees.map((emp) => (
              <ScanEmployeeCard
                key={emp.id}
                employee={emp}
                status={employeeStatuses?.[emp.id] ?? "OUT"}
                onSelect={handleSelectEmployee}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
