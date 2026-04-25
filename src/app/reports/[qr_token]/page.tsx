"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { endOfDay, endOfWeek, format, startOfDay, startOfWeek } from "date-fns";
import { AlertTriangle, Download, Loader2, LogOut, RefreshCw } from "lucide-react";

import PinGuard from "@/components/PinGuard";
import { ManagerWorkspaceHeader } from "@/components/manager/ManagerWorkspaceHeader";
import { ManagerWorkspaceShell } from "@/components/manager/ManagerWorkspaceShell";
import { WorkspacePanel } from "@/components/manager/WorkspacePanel";
import { AllEmployeesTimesheetTable } from "@/features/reports/components/AllEmployeesTimesheetTable";
import { EmployeeReportDetail } from "@/features/reports/components/EmployeeReportDetail";
import {
  buildReportData,
  rebuildEmployeeReport,
  summarizeEmployeeReports,
  updateRowTime,
} from "@/features/reports/data-processing";
import {
  applyReportDrafts,
  pruneReportDrafts,
  readStoredReportDrafts,
  removeReportDraft,
  shouldUseLocalDraftForRow,
  upsertReportDraft,
  writeStoredReportDrafts,
} from "@/features/reports/drafts";
import type { ReportDraft, TimesheetRow } from "@/features/reports/types";
import { buildReportsCsv } from "@/features/reports/export";
import { getReportsSnapshot, logoutManager, saveReportCorrection } from "@/lib/client-api";
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
  const [drafts, setDrafts] = useState<ReportDraft[]>([]);

  const syncDrafts = useCallback(
    (nextDrafts: ReportDraft[]) => {
      setDrafts(nextDrafts);
      writeStoredReportDrafts(qrToken, nextDrafts);
    },
    [qrToken],
  );

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
      const currentTime = new Date();

      const nextReportData = buildReportData(employees, allLogs, {
        rangeStart: filterStart,
        rangeEnd: filterEnd,
        currentTime,
        missingOutStrategy: "endOfDay",
      });
      const prunedDrafts = pruneReportDrafts(drafts, allLogs, currentTime);
      const mergedReports = applyReportDrafts(nextReportData.employeeGroups, prunedDrafts);

      if (JSON.stringify(prunedDrafts) !== JSON.stringify(drafts)) {
        syncDrafts(prunedDrafts);
      }

      setReportData(mergedReports);
    } catch {
      setError("Failed to fetch and calculate reports.");
    } finally {
      setCalculating(false);
    }
  }, [allLogs, dateStrEnd, dateStrStart, drafts, employees, store, syncDrafts]);

  useEffect(() => {
    setDrafts(readStoredReportDrafts(qrToken));
  }, [qrToken]);

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
  const selectedEmployee = useMemo(() => {
    if (selectedEmployeeId === "ALL") {
      return null;
    }

    return employees.find((employee) => employee.id === selectedEmployeeId) ?? null;
  }, [employees, selectedEmployeeId]);

  const globalSummary = useMemo(() => summarizeEmployeeReports(reportData), [reportData]);

  const updateTimesheetRow = useCallback(
    async (employeeId: string, rowIndex: number, field: "clockIn" | "clockOut", value: string) => {
      let updatedRow: TimesheetRow | null = null;
      let previousRow: TimesheetRow | null = null;

      setReportData((currentReports) =>
        currentReports.map((report) => {
          if (report.employee.id !== employeeId) {
            return report;
          }

          const nextRows = report.timesheetRows.map((row, index) => {
            if (index !== rowIndex) {
              return row;
            }

            previousRow = row;
            const nextRow = updateRowTime(row, field, value);
            if (nextRow !== row) {
              updatedRow = nextRow;
            }

            return nextRow;
          });

          return rebuildEmployeeReport(report.employee, nextRows);
        }),
      );

      if (!updatedRow) {
        return;
      }

      const committedRow = updatedRow as TimesheetRow;

      const now = new Date();
      const usesLocalDraft =
        field === "clockOut" &&
        previousRow &&
        shouldUseLocalDraftForRow(previousRow, now);

      if (usesLocalDraft) {
        const expectedElapsedClockOut = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const nextDrafts =
          value === expectedElapsedClockOut
            ? removeReportDraft(drafts, committedRow.employeeId, committedRow.clockInLogId)
            : upsertReportDraft(drafts, {
                employeeId: committedRow.employeeId,
                clockInLogId: committedRow.clockInLogId,
                draftClockOutAt: committedRow.clockOutAt.toISOString(),
                savedAt: now.toISOString(),
              });

        syncDrafts(nextDrafts);
        return;
      }

      try {
        const saved = await saveReportCorrection(qrToken, committedRow);
        setReportData((currentReports) =>
          currentReports.map((report) => {
            if (report.employee.id !== employeeId) {
              return report;
            }

            const nextRows = report.timesheetRows.map((row, index) =>
              index === rowIndex ? { ...row, clockOutLogId: saved.clockOutLogId } : row,
            );

            return rebuildEmployeeReport(report.employee, nextRows);
          }),
        );
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "QRShift couldn't save that report correction. Try again.",
        );
        await fetchSnapshot();
      }
    },
    [drafts, fetchSnapshot, qrToken, syncDrafts],
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
  const summaryHours =
    selectedEmployeeId === "ALL"
      ? globalSummary.totalHoursDecimal
      : (selectedReport?.totalHours ?? 0);
  const workedDayCount = selectedReport?.dailySummaries.length ?? 0;
  const summaryTitle = selectedEmployeeId === "ALL" ? "All employees" : (selectedEmployee?.name ?? "Employee");
  const summaryMeta =
    selectedEmployeeId === "ALL"
      ? `${reportData.length} employee${reportData.length === 1 ? "" : "s"}`
      : `${workedDayCount} worked day${workedDayCount === 1 ? "" : "s"}`;
  const anomalyCount = reportData.reduce(
    (total, report) => total + report.timesheetRows.filter((row) => row.shiftState === "autoClosed").length,
    0,
  );

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
          eyebrow="Reports"
          title={store?.name ?? "QRShift"}
          meta={
            <p className="text-sm font-medium text-text-muted">
              {format(new Date(dateStrStart), "MMM d, yyyy")} to {format(new Date(dateStrEnd), "MMM d, yyyy")}
            </p>
          }
          primaryAction={
            reportData.length > 0 ? (
              <button
                onClick={downloadCsv}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-primary bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            ) : null
          }
          secondaryAction={
            <button
              onClick={async () => {
                await logoutManager();
                window.location.reload();
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-surfacestroke bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-background"
              title="Lock reports"
            >
              <LogOut className="h-4 w-4" />
              <span>Lock</span>
            </button>
          }
        />

        <WorkspacePanel>
          <div className="space-y-4">
            <div className="rounded-[20px] border border-primary/15 bg-primary/8 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                    Report summary
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="truncate text-lg font-bold tracking-[-0.03em] text-foreground sm:text-xl">
                      {summaryTitle}
                    </p>
                    <span className="inline-flex min-h-[30px] items-center rounded-full border border-surfacestroke bg-background/80 px-3 py-1 text-xs font-semibold text-text-muted">
                      {summaryMeta}
                    </span>
                  </div>
                </div>

                <div className="rounded-[18px] border border-surfacestroke bg-background px-4 py-3 md:min-w-[220px] md:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                    Total hours
                  </p>
                  <p className="mt-2 font-mono-brand text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-[-0.06em] text-foreground">
                    {summaryHours.toFixed(2)}
                    <span className="ml-2 text-[0.55em] tracking-[-0.04em] text-text-muted">h</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
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

                <label className="flex min-h-[44px] min-w-[220px] flex-col justify-center rounded-[20px] border border-surfacestroke bg-background px-3 py-3">
                  <span className="sr-only">Employee</span>
                  <select
                    value={selectedEmployeeId}
                    onChange={(event) => setSelectedEmployeeId(event.target.value)}
                    disabled={employees.length === 0}
                    className="min-h-[44px] rounded-[14px] border border-surfacestroke bg-surface px-3 py-2 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="ALL">All employees</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex justify-start xl:justify-end">
                <button
                  onClick={async () => {
                    await fetchSnapshot();
                  }}
                  disabled={calculating}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-surfacestroke bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-surface disabled:opacity-70"
                >
                  <RefreshCw className={`h-4 w-4 ${calculating ? "animate-spin" : ""}`} />
                  <span>{calculating ? "Refreshing" : "Refresh"}</span>
                </button>
              </div>
            </div>
          </div>
        </WorkspacePanel>

        {anomalyCount > 0 ? (
          <div className="rounded-[22px] border border-amber-300/60 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="font-medium">
                {anomalyCount} shift{anomalyCount === 1 ? "" : "s"} {anomalyCount === 1 ? "was" : "were"} auto-closed
                at midnight because clock-out was missing. Review highlighted rows before exporting.
              </p>
            </div>
          </div>
        ) : null}

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
