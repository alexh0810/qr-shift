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
} from "lucide-react";

import PinGuard from "@/components/PinGuard";
import { ManagerWorkspaceHeader } from "@/components/manager/ManagerWorkspaceHeader";
import { ManagerWorkspaceShell } from "@/components/manager/ManagerWorkspaceShell";
import { ShiftStatusPanel } from "@/components/manager/ShiftStatusPanel";
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
        <ManagerWorkspaceHeader
          eyebrow="Dashboard"
          title={store.name}
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
              title="Lock dashboard"
            >
              <LogOut className="h-4 w-4" />
              <span>Lock</span>
            </button>
          }
          statusBadge={
            <div className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Radar className="h-4 w-4" />
              <span>{onShiftEmployees.length} on shift</span>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <ShiftStatusPanel
            title="On Shift"
            emptyMessage="No one is currently clocked in."
            icon={CheckCircle2}
            items={onShiftItems}
          />
          <ShiftStatusPanel
            title="Off Shift"
            emptyMessage="Everyone is currently on shift."
            icon={Clock3}
            items={offShiftItems}
          />
        </div>
      </div>
    </ManagerWorkspaceShell>
  );
}
