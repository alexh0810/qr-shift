"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  Radar,
  ScanLine,
  Users,
} from "lucide-react";

import InstallPrompt from "@/components/InstallPrompt";
import PinGuard from "@/components/PinGuard";
import { ManagerWorkspaceHeader } from "@/components/manager/ManagerWorkspaceHeader";
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-xl bg-error/10 p-4 text-center text-error shadow-sm">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const onShiftEmployees = employees.filter((employee) => employeeStatus[employee.id]?.type === "IN");
  const offShiftEmployees = employees.filter((employee) => employeeStatus[employee.id]?.type !== "IN");

  const summaryCards = [
    {
      label: "Scan ready",
      value: employees.length.toString().padStart(2, "0"),
      description: "Employees can clock in without apps or logins.",
      icon: <ScanLine className="h-4 w-4" />,
    },
    {
      label: "On shift",
      value: onShiftEmployees.length.toString().padStart(2, "0"),
      description: "Live attendance updates stay visible throughout the day.",
      icon: <Radar className="h-4 w-4" />,
    },
    {
      label: "Off shift",
      value: offShiftEmployees.length.toString().padStart(2, "0"),
      description: "Finished staff remain easy to review before export.",
      icon: <Clock3 className="h-4 w-4" />,
    },
    {
      label: "Export route",
      value: "CSV",
      description: "Move straight into payroll-ready reports from the same workspace.",
      icon: <Users className="h-4 w-4" />,
      valueClassName: "text-[2rem] sm:text-[2.15rem]",
    },
  ];

  const onShiftItems = onShiftEmployees.map((employee) => {
    const log = employeeStatus[employee.id];

    return {
      id: employee.id,
      name: employee.name,
      detail: log
        ? `Clocked in ${format(log.timestamp, "h:mm a")} · ${formatDistanceToNow(log.timestamp, { addSuffix: true })}`
        : "Currently active.",
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
        ? `Last activity ${format(log.timestamp, "MMM d, h:mm a")}`
        : "No recent activity yet.",
      statusLabel: "OUT",
      tone: "idle" as const,
    };
  });

  return (
    <PinGuard qr_token={params.qr_token}>
      <ManagerWorkspaceShell
        qrToken={params.qr_token}
        currentPath={`/dashboard/${params.qr_token}`}
      >
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
          <InstallPrompt />

          <ManagerWorkspaceHeader
            eyebrow="Scan -> Monitor -> Export"
            title={store.name}
            description="Monitor live attendance, keep manager access local to this device, and move into payroll-ready exports without leaving the shared workspace."
            meta={
              <p className="text-sm font-medium text-text-muted">
                Active on {format(now, "EEEE, MMM d, yyyy")} at {format(now, "h:mm a")}
              </p>
            }
            primaryAction={{
              label: "Open Reports",
              href: `/reports/${params.qr_token}`,
              icon: <ArrowRight className="h-4 w-4" />,
            }}
            secondaryAction={
              <button
                onClick={() => {
                  localStorage.removeItem(`store_${params.qr_token}_unlocked`);
                  window.location.reload();
                }}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-surfacestroke bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-background"
                title="Lock manager access"
              >
                <LogOut className="h-4 w-4" />
                <span>Lock manager access</span>
              </button>
            }
            statusBadge={
              <div className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Radar className="h-4 w-4" />
                <span>{onShiftEmployees.length} on shift</span>
              </div>
            }
            supportingContent={
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="inline-flex min-h-[44px] items-center gap-2 rounded-[18px] border border-surfacestroke bg-background px-4 py-2 text-sm font-semibold text-foreground">
                  <ScanLine className="h-4 w-4 text-primary" />
                  <span>Scan stays employee-simple</span>
                </div>
                <div className="inline-flex min-h-[44px] items-center gap-2 rounded-[18px] border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Radar className="h-4 w-4" />
                  <span>Monitor is the workspace anchor</span>
                </div>
                <div className="inline-flex min-h-[44px] items-center gap-2 rounded-[18px] border border-surfacestroke bg-background px-4 py-2 text-sm font-semibold text-foreground">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>Reports keeps export one tap away</span>
                </div>
              </div>
            }
          />

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <WorkspaceStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                description={card.description}
                icon={card.icon}
                valueClassName={card.valueClassName}
              />
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
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
