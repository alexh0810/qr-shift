"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { endOfDay, endOfWeek, format, isWithinInterval, startOfDay, startOfWeek } from "date-fns";
import { Download, FileSpreadsheet, Loader2, LogOut, RefreshCw } from "lucide-react";

import PinGuard from "@/components/PinGuard";
import { ManagerWorkspaceHeader } from "@/components/manager/ManagerWorkspaceHeader";
import { ManagerWorkspaceShell } from "@/components/manager/ManagerWorkspaceShell";
import { WorkspacePanel } from "@/components/manager/WorkspacePanel";
import { WorkspaceStatCard } from "@/components/manager/WorkspaceStatCard";
import { AllEmployeesTimesheetTable } from "@/features/reports/components/AllEmployeesTimesheetTable";
import { EmployeeReportDetail } from "@/features/reports/components/EmployeeReportDetail";
import { EmployeeSelect } from "@/features/reports/components/EmployeeSelect";
import {
  buildReportData,
  rebuildEmployeeReport,
  summarizeEmployeeReports,
  updateRowTime,
} from "@/features/reports/data-processing";
import { buildReportsCsv } from "@/features/reports/export";
import { MissingOutStrategy } from "@/features/reports/types";
import { getReportsSnapshot, logoutManager } from "@/lib/client-api";
import { Employee, PublicStore, Timelog } from "@/types";

export default function ReportsPage({ params }: { params: { qr_token: string } }) {
  return (
    <PinGuard qr_token={params.qr_token}>
      <ReportsWorkspace qrToken={params.qr_token} />
    </PinGuard>
  );
}

function ReportsWorkspace({ qrToken }: { qrToken: string }) {
  const defaultStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const defaultEndDate = endOfWeek(new Date(), { weekStartsOn: 1 });

  const [store, setStore] = useState<PublicStore | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allLogs, setAllLogs] = useState<Timelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateStrStart, setDateStrStart] = useState(format(defaultStartDate, "yyyy-MM-dd"));
  const [dateStrEnd, setDateStrEnd] = useState(format(defaultEndDate, "yyyy-MM-dd"));
  const [reportData, setReportData] = useState<ReturnType<typeof buildReportData>["employeeGroups"]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<"ALL" | string>("ALL");

  const fetchSnapshot = useCallback(async () => {
    const snapshot = await getReportsSnapshot(qrToken);
    setStore(snapshot.store);
    setEmployees(snapshot.employees);
    setAllLogs(snapshot.timelogs);
  }, [qrToken]);

  const fetchAndCalculate = useCallback(async () => {
    if (!store) {
      return;
    }

    setCalculating(true);
    setError(null);

    try {
      const filterStart = startOfDay(new Date(dateStrStart));
      const filterEnd = endOfDay(new Date(dateStrEnd));
      const now = new Date();
      const missingOutStrategy: MissingOutStrategy = isWithinInterval(now, {
        start: filterStart,
        end: filterEnd,
      })
        ? "currentTime"
        : "endOfDay";

      const nextReportData = buildReportData(employees, allLogs, {
        rangeStart: filterStart,
        rangeEnd: filterEnd,
        missingOutStrategy,
        currentTime: now,
      });

      setReportData(nextReportData.employeeGroups);
    } catch {
      setError("Failed to fetch and calculate reports.");
    } finally {
      setCalculating(false);
    }
  }, [allLogs, dateStrEnd, dateStrStart, employees, store]);

  useEffect(() => {
    fetchSnapshot()
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load store data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchSnapshot]);

  useEffect(() => {
    if (employees.length > 0 && store) {
      fetchAndCalculate();
    }
  }, [employees, fetchAndCalculate, store]);

  useEffect(() => {
    if (selectedEmployeeId === "ALL") {
      return;
    }

    const selectionExists = employees.some((employee) => employee.id === selectedEmployeeId);
    if (!selectionExists) {
      setSelectedEmployeeId("ALL");
    }
  }, [employees, selectedEmployeeId]);

  const selectedReport = useMemo(() => {
    if (selectedEmployeeId === "ALL") {
      return null;
    }

    return reportData.find((report) => report.employee.id === selectedEmployeeId) ?? null;
  }, [reportData, selectedEmployeeId]);

  const globalSummary = useMemo(() => summarizeEmployeeReports(reportData), [reportData]);

  const updateTimesheetRow = useCallback(
    (employeeId: string, rowIndex: number, field: "clockIn" | "clockOut", value: string) => {
      setReportData((currentReports) =>
        currentReports.map((report) => {
          if (report.employee.id !== employeeId) {
            return report;
          }

          const nextRows = report.timesheetRows.map((row, index) =>
            index === rowIndex ? updateRowTime(row, field, value) : row,
          );

          return rebuildEmployeeReport(report.employee, nextRows);
        }),
      );
    },
    [],
  );

  const downloadCsv = useCallback(() => {
    const csv = buildReportsCsv(
      reportData,
      globalSummary,
      selectedEmployeeId,
      store?.name,
      dateStrStart,
      dateStrEnd,
    );

    if (!csv) {
      return;
    }

    const blob = new Blob([csv.content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", csv.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [dateStrEnd, dateStrStart, globalSummary, reportData, selectedEmployeeId, store?.name]);

  const allEmployeesEmptyMessage =
    employees.length === 0
      ? "No employees available for this store."
      : calculating
        ? "Calculating..."
        : "No shifts logged in this period.";
  const totalRows = reportData.reduce((total, report) => total + report.timesheetRows.length, 0);
  const reportSummaryCards = [
    {
      label: "Payroll total",
      value: `${globalSummary.totalHoursDecimal.toFixed(2)} h`,
      description: globalSummary.display,
      icon: <FileSpreadsheet className="h-4 w-4" />,
      valueClassName: "text-[2rem] sm:text-[2.15rem]",
    },
    {
      label: "Employees",
      value: reportData.length.toString().padStart(2, "0"),
      description: "People included in the current workspace range.",
      icon: <FileSpreadsheet className="h-4 w-4" />,
    },
    {
      label: "Rows",
      value: totalRows.toString().padStart(2, "0"),
      description: "Timesheet rows currently visible before export.",
      icon: <RefreshCw className="h-4 w-4" />,
    },
    {
      label: "View",
      value: selectedEmployeeId === "ALL" ? "ALL" : "1:1",
      description:
        selectedEmployeeId === "ALL"
          ? "Workspace-wide payroll review."
          : selectedReport?.name ?? "Single employee detail view.",
      icon: <Download className="h-4 w-4" />,
      valueClassName: "text-[2rem] sm:text-[2.15rem]",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="font-bold text-error">{error}</p>
      </div>
    );
  }

  return (
    <ManagerWorkspaceShell qrToken={qrToken} currentPath={`/reports/${qrToken}`}>
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <ManagerWorkspaceHeader
          eyebrow="Scan -> Monitor -> Export"
          title={`${store?.name ?? "QRShift"} Reports`}
          description="Review payroll-ready rows, keep local edit behavior explicit, and export the selected date range from the same manager workspace."
          meta={
            <p className="text-sm font-medium text-text-muted">
              {format(new Date(dateStrStart), "MMM d, yyyy")} to {format(new Date(dateStrEnd), "MMM d, yyyy")}
            </p>
          }
          primaryAction={{
            label: "Back to Dashboard",
            href: `/dashboard/${qrToken}`,
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
              <FileSpreadsheet className="h-4 w-4" />
              <span>{reportData.length} report group{reportData.length === 1 ? "" : "s"}</span>
            </div>
          }
          supportingContent={
            <p className="max-w-3xl text-sm font-medium leading-6 text-text-muted">
              Adjusting times below updates this browser&apos;s export output only. The local edit model and CSV behavior remain unchanged during this redesign.
            </p>
          }
        />

        <WorkspacePanel
          eyebrow="Export controls"
          title="Selected payroll range"
          description="Stacked controls stay phone-safe, while tables keep deliberate horizontal overflow on larger views."
          headerActions={
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={async () => {
                  await fetchSnapshot();
                }}
                disabled={calculating}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-surfacestroke bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-surface disabled:opacity-70"
              >
                <RefreshCw className={`h-4 w-4 ${calculating ? "animate-spin" : ""}`} />
                <span>{calculating ? "Refreshing" : "Refresh range"}</span>
              </button>
              {reportData.length > 0 ? (
                <button
                  onClick={downloadCsv}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-primary bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Payroll Report</span>
                </button>
              ) : null}
            </div>
          }
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="flex min-h-[44px] flex-col gap-2 rounded-[20px] border border-surfacestroke bg-background px-3 py-3 sm:flex-row sm:items-center">
              <input
                type="date"
                value={dateStrStart}
                onChange={(event) => setDateStrStart(event.target.value)}
                className="min-h-[44px] rounded-[14px] border border-surfacestroke bg-surface px-3 py-2 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
              />
              <span className="px-1 text-center text-sm font-semibold text-text-muted">to</span>
              <input
                type="date"
                value={dateStrEnd}
                onChange={(event) => setDateStrEnd(event.target.value)}
                className="min-h-[44px] rounded-[14px] border border-surfacestroke bg-surface px-3 py-2 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>
        </WorkspacePanel>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reportSummaryCards.map((card) => (
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

        <div className="mb-6">
          <EmployeeSelect
            employees={employees}
            value={selectedEmployeeId}
            onChange={setSelectedEmployeeId}
            disabled={employees.length === 0}
          />
        </div>

        {error ? (
          <div className="rounded-[22px] border border-[color:color-mix(in_srgb,var(--error)_24%,var(--color-border-soft))] bg-error/10 px-4 py-4 text-sm font-semibold text-error">
            {error}
          </div>
        ) : null}

        <div className="animate-in fade-in duration-300">
          {selectedEmployeeId === "ALL" ? (
            <div className="space-y-6">
              <AllEmployeesTimesheetTable
                reports={reportData}
                emptyMessage={allEmployeesEmptyMessage}
                onTimeChange={updateTimesheetRow}
              />
            </div>
          ) : (
            <EmployeeReportDetail
              employees={employees}
              selectedEmployeeId={selectedEmployeeId}
              selectedReport={selectedReport}
              onTimeChange={updateTimesheetRow}
            />
          )}
        </div>
      </div>
    </ManagerWorkspaceShell>
  );
}
