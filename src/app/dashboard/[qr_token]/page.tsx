"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
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
import { getEmployeesByStoreId, getStoreByQrToken } from "@/lib/db";
import { db } from "@/lib/firebase";
import { Employee, Store, Timelog } from "@/types";
import Link from "next/link";

export default function DashboardPage({ params }: { params: { qr_token: string } }) {
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeStatus, setEmployeeStatus] = useState<Record<string, Timelog>>({});

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

  const renderStatusTime = (log: Timelog) => (
    <span className="text-xs text-text-muted">
      since {format(log.timestamp, "h:mm a")} ({formatDistanceToNow(log.timestamp, { addSuffix: true })})
    </span>
  );

  const summaryCards = [
    {
      label: "Scan",
      value: employees.length.toString().padStart(2, "0"),
      detail: "Employees can clock in without apps or logins.",
      icon: ScanLine,
    },
    {
      label: "Monitor",
      value: onShiftEmployees.length.toString().padStart(2, "0"),
      detail: "Live attendance updates stay visible for the whole shift.",
      icon: Radar,
    },
    {
      label: "On Shift",
      value: onShiftEmployees.length.toString().padStart(2, "0"),
      detail: "Current headcount ready for owner check-ins.",
      icon: CheckCircle2,
    },
    {
      label: "Off Shift",
      value: offShiftEmployees.length.toString().padStart(2, "0"),
      detail: "Finished staff remain easy to review before export.",
      icon: Clock3,
    },
  ];

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
            title={`${store.name} Dashboard`}
            description="Monitor live attendance, keep manager access local to this device, and move into payroll-ready exports without leaving the shared workspace."
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
                <span>{onShiftEmployees.length} active now</span>
              </div>
            }
          />

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.label}
                  className="rounded-[24px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                      {card.label}
                    </p>
                    <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-surfacestroke bg-background text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-4 font-mono-brand text-3xl font-bold tracking-[-0.04em] text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-text-muted">
                    {card.detail}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="rounded-[28px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)] sm:px-6">
            <div className="flex flex-col gap-4 border-b border-surfacestroke pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                  Workspace story
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                  Dashboard keeps Monitor at the center
                </h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="inline-flex min-h-[44px] items-center gap-2 rounded-[18px] border border-surfacestroke bg-background px-4 py-2 text-sm font-semibold text-foreground">
                  <ScanLine className="h-4 w-4 text-primary" />
                  <span>Scan</span>
                </div>
                <div className="inline-flex min-h-[44px] items-center gap-2 rounded-[18px] border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Radar className="h-4 w-4" />
                  <span>Monitor</span>
                </div>
                <Link
                  href={`/reports/${params.qr_token}`}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-surfacestroke bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-surface"
                >
                  <Users className="h-4 w-4 text-primary" />
                  <span>Export in Reports</span>
                </Link>
              </div>
            </div>
            <p className="pt-5 text-sm font-medium leading-6 text-text-muted sm:text-base">
              Live status stays grouped for quick decisions on phone-width and desktop screens, without forcing horizontal page scrolling.
            </p>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-[28px] border border-surfacestroke bg-surface shadow-[var(--shadow-panel)]">
              <div className="flex flex-col gap-2 border-b border-surfacestroke px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-success/12 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">On Shift</h2>
                    <p className="text-sm font-medium text-text-muted">
                      {onShiftEmployees.length} active right now
                    </p>
                  </div>
                </div>
              </div>

              {onShiftEmployees.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm font-medium text-text-muted sm:px-6">
                  No one is currently clocked in.
                </div>
              ) : (
                <ul className="divide-y divide-surfacestroke">
                  {onShiftEmployees.map((employee) => {
                    const log = employeeStatus[employee.id];
                    return (
                      <li
                        key={employee.id}
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-success/15 bg-success/10">
                            <span className="text-base font-bold text-success">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground">{employee.name}</p>
                            {log ? renderStatusTime(log) : null}
                          </div>
                        </div>
                        <span className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-success px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white">
                          IN
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-[28px] border border-surfacestroke bg-surface shadow-[var(--shadow-panel)]">
              <div className="flex flex-col gap-2 border-b border-surfacestroke px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-background text-text-muted">
                    <Circle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Off Shift</h2>
                    <p className="text-sm font-medium text-text-muted">
                      {offShiftEmployees.length} available or finished
                    </p>
                  </div>
                </div>
              </div>

              {offShiftEmployees.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm font-medium text-text-muted sm:px-6">
                  Everyone is on shift.
                </div>
              ) : (
                <ul className="divide-y divide-surfacestroke">
                  {offShiftEmployees.map((employee) => {
                    const log = employeeStatus[employee.id];
                    return (
                      <li
                        key={employee.id}
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-surfacestroke bg-background">
                            <span className="text-base font-bold text-text-muted">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground">{employee.name}</p>
                            {log ? (
                              <span className="text-xs font-medium text-text-muted">
                                Last activity: {format(log.timestamp, "MMM d, h:mm a")}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-text-muted">
                                No recent activity yet.
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-surfacestroke bg-background px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                          OUT
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </ManagerWorkspaceShell>
    </PinGuard>
  );
}
