"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { endOfDay, endOfWeek, format, isWithinInterval, startOfDay, startOfWeek } from "date-fns";
import { ArrowLeft, Loader2, LogOut, RefreshCw, Share } from "lucide-react";
import Link from "next/link";

import PinGuard from "@/components/PinGuard";
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 sticky top-3 z-10 flex flex-col gap-4 rounded-[32px] border border-surfacestroke bg-surface/95 p-6 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <Link
                  href={`/dashboard/${params.qr_token}`}
                  className="rounded-full bg-surfacestroke p-2 text-foreground/40 transition-colors hover:text-foreground/70"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-foreground">Reports</h1>
                <button
                  onClick={() => {
                    localStorage.removeItem(`store_${params.qr_token}_unlocked`);
                    window.location.reload();
                  }}
                  className="ml-1 text-foreground/40 transition-colors hover:text-error"
                  title="Lock Reports"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-foreground/60">{store?.name} Timesheets</p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="flex w-full items-center rounded-2xl border border-surfacestroke bg-surfacestroke p-1 sm:w-auto">
                <input
                  type="date"
                  value={dateStrStart}
                  onChange={(event) => setDateStrStart(event.target.value)}
                  className="w-full flex-1 border-none bg-transparent px-1 text-[13px] font-medium text-foreground outline-none sm:text-sm"
                />
                <span className="px-1 text-sm text-foreground/40">to</span>
                <input
                  type="date"
                  value={dateStrEnd}
                  onChange={(event) => setDateStrEnd(event.target.value)}
                  className="w-full flex-1 border-none bg-transparent px-1 text-[13px] font-medium text-foreground outline-none sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchAndCalculate}
                  disabled={calculating}
                  className="flex h-10 flex-1 items-center justify-center rounded-full bg-primary p-2.5 text-white transition-colors active:scale-95 hover:bg-primary-dark disabled:opacity-70 sm:flex-none"
                >
                  <RefreshCw className={`w-5 h-5 ${calculating ? "animate-spin" : ""}`} />
                </button>
                {reportData.length > 0 ? (
                  <button
                    onClick={downloadCsv}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors active:scale-95 hover:bg-primary-dark sm:flex-none"
                  >
                    <Share className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                ) : null}
              </div>
            </div>
          </header>

          <div className="mb-6">
            <EmployeeSelect
              employees={employees}
              value={selectedEmployeeId}
              onChange={setSelectedEmployeeId}
              disabled={employees.length === 0}
            />
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl bg-error/10 p-4 text-center font-medium text-error shadow-sm">
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
                  <div className="rounded-3xl border border-surfacestroke bg-surface p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
                      Total Hours (All Employees)
                    </p>
                    <ReportSummaryCards
                      totalHours={globalSummary.totalHoursDecimal}
                      durationLabel={globalSummary.display}
                    />
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
      </div>
    </PinGuard>
  );
}
