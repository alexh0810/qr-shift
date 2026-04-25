"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  CheckCircle2,
  Clock3,
  Link as LinkIcon,
  Loader2,
  LogOut,
} from "lucide-react";
import Link from "next/link";

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
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-lg border border-error/20 bg-error/5 px-5 py-4 text-center">
          <p className="text-sm font-medium text-error">{error}</p>
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
        ? `Clocked in ${format(log.timestamp, "h:mm a")} · ${formatDistanceToNow(log.timestamp, { addSuffix: true })}`
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
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted transition-colors hover:text-foreground"
            title="Lock manager access"
          >
            <LogOut className="h-3.5 w-3.5" />
            Lock
          </button>
        }
      >
        <div className="space-y-6">
          <InstallPrompt />

          {/* Page header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {store.name}
              </h1>
              <p className="mt-0.5 text-sm text-muted">
                {format(now, "EEEE, MMM d")} &middot; {format(now, "h:mm a")}
              </p>
            </div>
            <Link
              href={`/reports/${params.qr_token}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Reports
            </Link>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <WorkspaceStatCard
              label="On shift"
              value={onShiftEmployees.length.toString()}
            />
            <WorkspaceStatCard
              label="Off shift"
              value={offShiftEmployees.length.toString()}
            />
            <WorkspaceStatCard
              label="Total"
              value={employees.length.toString()}
            />
          </div>

          {/* Shift panels */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ShiftStatusPanel
              title="On Shift"
              description={`${onShiftEmployees.length} active now`}
              emptyMessage="No one is currently clocked in."
              icon={CheckCircle2}
              items={onShiftItems}
            />
            <ShiftStatusPanel
              title="Off Shift"
              description={`${offShiftEmployees.length} not clocked in`}
              emptyMessage="Everyone is currently on shift."
              icon={Clock3}
              items={offShiftItems}
            />
          </div>
        </div>
      </ManagerWorkspaceShell>
    </PinGuard>
  );
}
