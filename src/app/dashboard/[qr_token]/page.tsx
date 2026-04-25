"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
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
import { getDashboardSnapshot, logoutManager } from "@/lib/client-api";
import { DashboardEmployeeStatus, PublicStore } from "@/types";

export default function DashboardPage({ params }: { params: { qr_token: string } }) {
  return (
    <PinGuard qr_token={params.qr_token}>
      <DashboardWorkspace qrToken={params.qr_token} />
    </PinGuard>
  );
}

function DashboardWorkspace({ qrToken }: { qrToken: string }) {
  const [store, setStore] = useState<PublicStore | null>(null);
  const [employees, setEmployees] = useState<DashboardEmployeeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const snapshot = await getDashboardSnapshot(qrToken);
        if (!active) {
          return;
        }

        setStore(snapshot.store);
        setEmployees(snapshot.employees);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data. Please try again.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    const interval = window.setInterval(loadDashboard, 60_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [qrToken]);

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

  const onShiftEmployees = employees.filter((entry) => entry.status === "IN");
  const offShiftEmployees = employees.filter((entry) => entry.status !== "IN");

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
      description: "Protected snapshot refreshes keep attendance visible throughout the day.",
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

  const onShiftItems = onShiftEmployees.map((entry) => {
    const log = entry.latestLog;

    return {
      id: entry.employee.id,
      name: entry.employee.name,
      detail: log
        ? `Clocked in ${format(log.timestamp, "h:mm a")} · ${formatDistanceToNow(log.timestamp, { addSuffix: true })}`
        : "Currently active.",
      statusLabel: "IN",
      tone: "active" as const,
    };
  });

  const offShiftItems = offShiftEmployees.map((entry) => {
    const log = entry.latestLog;

    return {
      id: entry.employee.id,
      name: entry.employee.name,
      detail: log ? `Last activity ${format(log.timestamp, "MMM d, h:mm a")}` : "No recent activity yet.",
      statusLabel: "OUT",
      tone: "idle" as const,
    };
  });

  return (
    <ManagerWorkspaceShell qrToken={qrToken} currentPath={`/dashboard/${qrToken}`}>
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
            href: `/reports/${qrToken}`,
            icon: <ArrowRight className="h-4 w-4" />,
          }}
          secondaryAction={
            <button
              onClick={async () => {
                await logoutManager();
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
                <span>Protected polling keeps status current</span>
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
  );
}
