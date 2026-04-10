"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { endOfDay, endOfWeek, format, isWithinInterval, startOfDay, startOfWeek } from "date-fns";
import { Download, Loader2, LogOut, RefreshCw, Sparkles } from "lucide-react";

import PinGuard from "@/components/PinGuard";
import { ManagerWorkspaceHeader } from "@/components/manager/ManagerWorkspaceHeader";
import { ManagerWorkspaceShell } from "@/components/manager/ManagerWorkspaceShell";
import { AllEmployeesTimesheetTable } from "@/features/reports/components/AllEmployeesTimesheetTable";
import { EmployeeReportDetail } from "@/features/reports/components/EmployeeReportDetail";
import { EmployeeSelect } from "@/features/reports/components/EmployeeSelect";
import { ReportSummaryCards } from "@/features/reports/components/ReportSummaryCards";
import { buildReportData, rebuildEmployeeReport, summarizeEmployeeReports, updateRowTime } from "@/features/reports/data-processing";
import { buildReportsCsv } from "@/features/reports/export";
import { MissingOutStrategy } from "@/features/reports/types";
import { getEmployeesByStoreId, getStoreByQrToken, getStoreTimelogs } from "@/lib/db";
import { Employee, Store } from "@/types";

export default function ReportsPage({ params }: { params: { qr_token: string } }) {
  const defaultStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const defaultEndDate = endOfWeek(new Date(), { weekStartsOn: 1 });

  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateStrStart, setDateStrStart] = useState(format(defaultStartDate, "yyyy-MM-dd"));
  const [dateStrEnd, setDateStrEnd] = useState(format(defaultEndDate, "yyyy-MM-dd"));
  const [reportData, setReportData] = useState<ReturnType<typeof buildReportData>["employeeGroups"]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<"ALL" | string>("ALL");

  const fetchAndCalculate = useCallback(async () => {
    if (!store) {
      return;
    }

    setCalculating(true);
    setError(null);

    try {
      const filterStart = startOfDay(new Date(dateStrStart));
      const filterEnd = endOfDay(new Date(dateStrEnd));
      const allLogs = await getStoreTimelogs(store.id);

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
  }, [dateStrEnd, dateStrStart, employees, store]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const foundStore = await getStoreByQrToken(params.qr_token);
        if (!foundStore) {
          setError("Invalid QR Token. Store not found.");
          setLoading(false);
          return;
        }

        setStore(foundStore);
        setEmployees(await getEmployeesByStoreId(foundStore.id));
      } catch {
        setError("Failed to load store data.");
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, [params.qr_token]);

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
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [dateStrEnd, dateStrStart, globalSummary, reportData, selectedEmployeeId, store?.name]);

  const allEmployeesEmptyMessage =
    employees.length === 0
      ? "No employees available for this store."
      : calculating
        ? "Calculating..."
        : "No shifts logged in this period.";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-error font-bold">{error}</p>
      </div>
    );
  }

  return (
    <PinGuard qr_token={params.qr_token}>
      <ManagerWorkspaceShell
        qrToken={params.qr_token}
        currentPath={`/reports/${params.qr_token}`}
      >
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
          <ManagerWorkspaceHeader
            eyebrow="Scan -> Monitor -> Export"
            title={`${store?.name ?? "QRShift"} Reports`}
            description="Review payroll-ready rows, keep local edit behavior explicit, and export the selected date range from the same manager workspace."
            primaryAction={{
              label: "Back to Dashboard",
              href: `/dashboard/${params.qr_token}`,
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
                <Sparkles className="h-4 w-4" />
                <span>{reportData.length} report group{reportData.length === 1 ? "" : "s"}</span>
              </div>
            }
          />

          <section className="rounded-[28px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)] sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                    Export controls
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                    Selected payroll range
                  </h2>
                </div>
                <p className="max-w-2xl text-sm font-medium leading-6 text-text-muted">
                  Adjusting times below updates this browser&apos;s export output only. The current in-memory edit model is unchanged.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
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

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={fetchAndCalculate}
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
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[24px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">Employees</p>
              <p className="mt-4 font-mono-brand text-3xl font-bold tracking-[-0.04em] text-foreground">{employees.length.toString().padStart(2, "0")}</p>
              <p className="mt-2 text-sm font-medium leading-6 text-text-muted">People included in the current workspace.</p>
            </article>
            <article className="rounded-[24px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">Report Rows</p>
              <p className="mt-4 font-mono-brand text-3xl font-bold tracking-[-0.04em] text-foreground">
                {reportData.reduce((total, report) => total + report.timesheetRows.length, 0).toString().padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-text-muted">Rows visible before CSV export.</p>
            </article>
            <article className="rounded-[24px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">Payroll Total</p>
              <p className="mt-4 font-mono-brand text-3xl font-bold tracking-[-0.04em] text-foreground">{globalSummary.totalHoursDecimal.toFixed(2)} h</p>
              <p className="mt-2 text-sm font-medium leading-6 text-text-muted">Decimal hours across the selected period.</p>
            </article>
            <article className="rounded-[24px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">View</p>
              <p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-foreground">
                {selectedEmployeeId === "ALL" ? "All Employees" : selectedReport?.name ?? "Employee Detail"}
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-text-muted">Switch between workspace-wide and single-person review.</p>
            </article>
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

                {reportData.length > 0 ? (
                  <div className="rounded-[28px] border border-surfacestroke bg-surface p-5 shadow-[var(--shadow-panel)] sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                          All employees summary
                        </p>
                        <h3 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
                          Export-ready totals
                        </h3>
                      </div>
                      <p className="max-w-xl text-sm font-medium leading-6 text-text-muted">
                        Totals below reflect the same local row edits shown in the table and the CSV export.
                      </p>
                    </div>
                    <div className="mt-5">
                      <ReportSummaryCards
                        totalHours={globalSummary.totalHoursDecimal}
                        durationLabel={globalSummary.display}
                      />
                    </div>
                  </div>
                ) : null}
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
    </PinGuard>
  );
}
