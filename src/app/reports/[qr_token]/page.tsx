"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { endOfDay, endOfWeek, format, isWithinInterval, startOfDay, startOfWeek } from "date-fns";
import { Download, Loader2, LogOut, RefreshCw } from "lucide-react";
import Link from "next/link";

import PinGuard from "@/components/PinGuard";
import { ManagerWorkspaceShell } from "@/components/manager/ManagerWorkspaceShell";
import { WorkspaceStatCard } from "@/components/manager/WorkspaceStatCard";
import { AllEmployeesTimesheetTable } from "@/features/reports/components/AllEmployeesTimesheetTable";
import { EmployeeReportDetail } from "@/features/reports/components/EmployeeReportDetail";
import { EmployeeSelect } from "@/features/reports/components/EmployeeSelect";
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
    if (!store) return;
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
    if (selectedEmployeeId === "ALL") return;
    const selectionExists = employees.some((employee) => employee.id === selectedEmployeeId);
    if (!selectionExists) setSelectedEmployeeId("ALL");
  }, [employees, selectedEmployeeId]);

  const selectedReport = useMemo(() => {
    if (selectedEmployeeId === "ALL") return null;
    return reportData.find((report) => report.employee.id === selectedEmployeeId) ?? null;
  }, [reportData, selectedEmployeeId]);

  const globalSummary = useMemo(() => summarizeEmployeeReports(reportData), [reportData]);

  const updateTimesheetRow = useCallback(
    (employeeId: string, rowIndex: number, field: "clockIn" | "clockOut", value: string) => {
      setReportData((currentReports) =>
        currentReports.map((report) => {
          if (report.employee.id !== employeeId) return report;
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
    if (!csv) return;
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
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm font-medium text-error">{error}</p>
      </div>
    );
  }

  return (
    <PinGuard qr_token={params.qr_token}>
      <ManagerWorkspaceShell
        qrToken={params.qr_token}
        currentPath={`/reports/${params.qr_token}`}
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
          {/* Page header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Reports
              </h1>
              <p className="mt-0.5 text-sm text-muted">{store?.name}</p>
            </div>
            <Link
              href={`/dashboard/${params.qr_token}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          </div>

          {/* Date range + export controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateStrStart}
                onChange={(event) => setDateStrStart(event.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
              <span className="text-sm text-muted">to</span>
              <input
                type="date"
                value={dateStrEnd}
                onChange={(event) => setDateStrEnd(event.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAndCalculate}
                disabled={calculating}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${calculating ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {reportData.length > 0 ? (
                <button
                  onClick={downloadCsv}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              ) : null}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            <WorkspaceStatCard
              label="Total hours"
              value={`${globalSummary.totalHoursDecimal.toFixed(2)} h`}
            />
            <WorkspaceStatCard
              label="Employees"
              value={reportData.length.toString()}
            />
          </div>

          {/* Employee filter */}
          <EmployeeSelect
            employees={employees}
            value={selectedEmployeeId}
            onChange={setSelectedEmployeeId}
            disabled={employees.length === 0}
          />

          {/* Error */}
          {error ? (
            <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {error}
            </div>
          ) : null}

          {/* Timesheet table */}
          <div className="animate-in fade-in duration-300">
            {selectedEmployeeId === "ALL" ? (
              <AllEmployeesTimesheetTable
                reports={reportData}
                emptyMessage={allEmployeesEmptyMessage}
                onTimeChange={updateTimesheetRow}
              />
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
