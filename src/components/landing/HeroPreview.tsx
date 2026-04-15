import { ArrowRight, Download, Radar, ScanLine } from "lucide-react";

import { ProductPreviewFrame } from "@/components/landing/ProductPreviewFrame";
import { ManagerWorkspaceHeader } from "@/components/manager/ManagerWorkspaceHeader";
import { ShiftStatusPanel } from "@/components/manager/ShiftStatusPanel";
import { WorkspacePanel } from "@/components/manager/WorkspacePanel";
import { WorkspaceStatCard } from "@/components/manager/WorkspaceStatCard";
import { ScanActionPanel } from "@/components/scan/ScanActionPanel";
import { ReportSummaryCards } from "@/features/reports/components/ReportSummaryCards";

export function HeroPreview() {
  const onShiftItems = [
    {
      id: "nora",
      name: "Nora Kim",
      detail: "Clocked in 8:57 AM · 2 hours ago",
      statusLabel: "IN",
      tone: "active" as const,
    },
    {
      id: "liam",
      name: "Liam Park",
      detail: "Clocked in 9:12 AM · 1 hour ago",
      statusLabel: "IN",
      tone: "active" as const,
    },
  ];

  const offShiftItems = [
    {
      id: "jules",
      name: "Jules Martin",
      detail: "Last activity Apr 15, 2:12 PM",
      statusLabel: "OUT",
      tone: "idle" as const,
    },
    {
      id: "sana",
      name: "Sana Boyd",
      detail: "No recent activity yet.",
      statusLabel: "OUT",
      tone: "idle" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)] sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
          Scan -&gt; Monitor -&gt; Export
        </p>
        <h3 className="mt-3 font-display text-[clamp(2rem,4vw,2.8rem)] font-bold tracking-[-0.05em] text-foreground">
          The landing proof now comes from the shipped product UI itself.
        </h3>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-text-muted sm:text-base">
          Dashboard stays dominant, while the scan and reports surfaces support the same workflow
          with the exact manager and employee components used inside the app.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
        <ProductPreviewFrame
          label="Dashboard preview"
          description="The live board is the main proof surface, using the same manager header, workspace cards, and shift panels as the product routes."
          className="lg:row-span-2"
        >
          <div className="space-y-4">
            <ManagerWorkspaceHeader
              eyebrow="Scan -> Monitor -> Export"
              title="Harbor Cafe"
              description="Monitor live attendance, keep manager access local to this device, and move into payroll-ready exports without leaving the shared workspace."
              meta={<p className="text-sm font-medium text-text-muted">Active on Tuesday, Apr 15 at 10:12 AM</p>}
              primaryAction={{
                label: "Open Reports",
                href: "#reports-preview",
                icon: <ArrowRight className="h-4 w-4" />,
              }}
              statusBadge={
                <div className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Radar className="h-4 w-4" />
                  <span>2 on shift</span>
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

            <div className="grid gap-3 sm:grid-cols-3">
              <WorkspaceStatCard
                label="Scan ready"
                value="06"
                description="Employees can clock in without apps or logins."
                icon={<ScanLine className="h-4 w-4" />}
              />
              <WorkspaceStatCard
                label="On shift"
                value="02"
                description="Live attendance updates stay visible throughout the day."
                icon={<Radar className="h-4 w-4" />}
              />
              <WorkspaceStatCard
                label="Export route"
                value="CSV"
                description="Move straight into payroll-ready reports from the same workspace."
                icon={<Download className="h-4 w-4" />}
                valueClassName="text-[2rem] sm:text-[2.15rem]"
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ShiftStatusPanel
                title="On Shift"
                description="2 active now"
                emptyMessage="No one is currently clocked in."
                icon={Radar}
                items={onShiftItems}
              />
              <ShiftStatusPanel
                title="Off Shift"
                description="2 not clocked in"
                emptyMessage="Everyone is currently on shift."
                icon={ArrowRight}
                items={offShiftItems}
              />
            </div>
          </div>
        </ProductPreviewFrame>

        <ProductPreviewFrame
          label="Scan preview"
          description="The same employee scan panel stays quick and standalone."
        >
          <div className="max-w-md">
            <ScanActionPanel
              employeeName="Nora Kim"
              nextAction="IN"
              latestTimestamp={null}
              timelogLoading={false}
              actionLoading={false}
              successMessage={null}
              onBack={() => undefined}
              onConfirm={() => undefined}
            />
          </div>
        </ProductPreviewFrame>

        <ProductPreviewFrame
          label="Reports preview"
          description="The export companion uses the same workspace primitives and report summaries as the live route."
        >
          <div id="reports-preview">
            <WorkspacePanel
              eyebrow="Payroll summary"
              title="Selected payroll range"
              description="Local row edits remain explicit before export."
              headerActions={
                <button className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-primary bg-primary px-4 py-3 text-sm font-semibold text-white">
                  <Download className="h-4 w-4" />
                  <span>Export Payroll Report</span>
                </button>
              }
            >
              <ReportSummaryCards totalHours={36.5} durationLabel="36h 30m" />
            </WorkspacePanel>
          </div>
        </ProductPreviewFrame>
      </div>
    </div>
  );
}
