"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Users,
} from "lucide-react";

import InstallPrompt from "@/components/InstallPrompt";
import PinGuard from "@/components/PinGuard";
import { ManagerWorkspaceShell } from "@/components/manager/ManagerWorkspaceShell";
import { ShiftStatusPanel } from "@/components/manager/ShiftStatusPanel";
import { WorkspaceStatCard } from "@/components/manager/WorkspaceStatCard";
import { getEmployeesByStoreId, getStoreByQrToken } from "@/lib/db";
import { db } from "@/lib/firebase";
import { Employee, Store, Timelog } from "@/types";

export default function DashboardPage({ params }: { params: { qr_token: string } }) {
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeStatus, setEmployeeStatus] = useState<Record<string, Timelog>>({});
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let unsubscribeTimelogs: () => void;

    async function loadData() {
      try {
        const foundStore = await getStoreByQrToken(params.qr_token);
        if (!foundStore) {
          setError("Invalid QR Token. Store not found.");
          setLoading(false);
          return;
        }
        setStore(foundStore);

        const storeEmployees = await getEmployeesByStoreId(foundStore.id);
        setEmployees(storeEmployees);

        const timelogsRef = collection(db, "timelogs");
        const q = query(timelogsRef, where("store_id", "==", foundStore.id));

        unsubscribeTimelogs = onSnapshot(
          q,
          (snapshot) => {
            const newStatus: Record<string, Timelog> = {};
            const logs = snapshot.docs
              .map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  employee_id: data.employee_id,
                  store_id: data.store_id,
                  type: data.type as "IN" | "OUT",
                  timestamp: data.timestamp?.toDate() || new Date(),
                } as Timelog;
              })
              .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

            for (const log of logs) {
              newStatus[log.employee_id] = log;
            }

            setEmployeeStatus(newStatus);
            setLoading(false);
          },
          () => {
            setError("Real-time listener failed to connect.");
            setLoading(false);
          },
        );
      } catch {
        setError("Failed to load dashboard data. Please try again.");
        setLoading(false);
      }
    }

    loadData();
    localStorage.setItem("last_dashboard_token", params.qr_token);

    return () => {
      if (unsubscribeTimelogs) {
        unsubscribeTimelogs();
      }
    };
  }, [params.qr_token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-xl border border-error/20 bg-error-light px-6 py-5 text-center">
          <p className="font-medium text-error">{error}</p>
        </div>
      </div>
    );
  }

  const onShiftEmployees = employees.filter(
    (employee) => employeeStatus[employee.id]?.type === "IN",
  );
  const offShiftEmployees = employees.filter(
    (employee) => employeeStatus[employee.id]?.type !== "IN",
  );

  const onShiftItems = onShiftEmployees.map((employee) => {
    const log = employeeStatus[employee.id];
    return {
      id: employee.id,
      name: employee.name,
      detail: log
        ? `Clocked in ${format(log.timestamp, "h:mm a")} - ${formatDistanceToNow(log.timestamp, { addSuffix: false })} ago`
        : "Currently active",
      statusLabel: "IN",
      tone: "active" as const,
    };
  });

  const offShiftItems = offShiftEmployees.map((employee) => {
    const log = employeeStatus[employee.id];
    return {
      id: employee.id,
      name: employee.name,
      detail: log
        ? `Last seen ${format(log.timestamp, "MMM d, h:mm a")}`
        : "No activity yet",
      statusLabel: "OUT",
      tone: "idle" as const,
    };
  });

  return (
    <PinGuard qr_token={params.qr_token}>
      <ManagerWorkspaceShell
        qrToken={params.qr_token}
        currentPath={`/dashboard/${params.qr_token}`}
        utilitySlot={
          <button
            onClick={() => {
              localStorage.removeItem(`store_${params.qr_token}_unlocked`);
              window.location.reload();
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
            title="Lock manager access"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        }
      >
        <div className="space-y-6">
          <InstallPrompt />

          {/* Page header */}
          <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {store.name}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {format(now, "EEEE, MMMM d, yyyy")} at {format(now, "h:mm a")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-light">
                  <div className="h-3 w-3 animate-pulse-soft rounded-full bg-success" />
                </div>
                <span className="text-sm font-medium text-foreground">Live</span>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <WorkspaceStatCard
              label="On Shift"
              value={onShiftEmployees.length}
              icon={CheckCircle2}
              variant="success"
            />
            <WorkspaceStatCard
              label="Off Shift"
              value={offShiftEmployees.length}
              icon={Clock}
              variant="default"
            />
            <WorkspaceStatCard
              label="Total Staff"
              value={employees.length}
              icon={Users}
              variant="primary"
            />
          </div>

          {/* Shift panels */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ShiftStatusPanel
              title="On Shift"
              description={`${onShiftEmployees.length} currently working`}
              emptyMessage="No one is currently clocked in."
              icon={CheckCircle2}
              items={onShiftItems}
              variant="active"
            />
            <ShiftStatusPanel
              title="Off Shift"
              description={`${offShiftEmployees.length} not clocked in`}
              emptyMessage="Everyone is currently on shift."
              icon={Clock}
              items={offShiftItems}
              variant="idle"
            />
          </div>
        </div>
      </ManagerWorkspaceShell>
    </PinGuard>
  );
}
