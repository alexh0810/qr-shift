"use client";

import { format } from "date-fns";

import { formatPayrollDuration } from "@/lib/time-calculation";
import { Employee } from "@/types";
import { EmployeeReport } from "../types";
import { ReportSummaryCards } from "./ReportSummaryCards";

interface EmployeeReportDetailProps {
  employees: Employee[];
  selectedEmployeeId: string;
  selectedReport: EmployeeReport | null;
  onTimeChange: (
    employeeId: string,
    rowIndex: number,
    field: "clockIn" | "clockOut",
    value: string,
  ) => void;
}

export function EmployeeReportDetail({
  employees,
  selectedEmployeeId,
  selectedReport,
  onTimeChange,
}: EmployeeReportDetailProps) {
  const hasDetailData = !!selectedReport && selectedReport.timesheetRows.length > 0;
  const isValidSelection = employees.some((employee) => employee.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-surfacestroke bg-surface p-5 shadow-[var(--shadow-panel)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
              Employee summary
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground">
              {selectedReport?.name ?? "No data"}
            </h2>
            <p className="mt-1 text-sm font-medium leading-6 text-text-muted">
              {selectedReport
                ? `${selectedReport.dailySummaries.length} worked day(s) in selected period`
                : isValidSelection
                  ? "No shifts logged in this period."
                  : "Invalid employee selection."}
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-text-muted">
              Edits here stay local to this browser session and affect the exported report you download from this workspace.
            </p>
          </div>

          <div className="min-w-full lg:min-w-[320px]">
            <ReportSummaryCards
              totalHours={selectedReport?.totalHours ?? 0}
              durationLabel={formatPayrollDuration(selectedReport?.totalMinutes ?? 0)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-surfacestroke bg-surface shadow-[var(--shadow-panel)]">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surfacestroke bg-background">
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted sm:px-6">Date</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted sm:px-6">Clock In</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted sm:px-6">Clock Out</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted sm:px-6">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surfacestroke">
              {!hasDetailData ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm font-medium text-text-muted sm:px-6">
                    {employees.length === 0
                      ? "No employees available for this store."
                      : isValidSelection
                        ? "No data for this employee in the selected period."
                        : "Invalid employee selection."}
                  </td>
                </tr>
              ) : (
                selectedReport.timesheetRows.map((row, index) => (
                  <tr key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`} className="transition-colors hover:bg-background">
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-semibold text-foreground">
                        {format(row.clockInAt, "EEE, MMM d, yyyy")}
                      </p>
                      {row.note ? (
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-error">{row.note}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                      <input
                        type="time"
                        value={row.clockIn}
                        onChange={(event) =>
                          onTimeChange(selectedReport.employee.id, index, "clockIn", event.target.value)
                        }
                        className="min-h-[44px] w-28 rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                      <input
                        type="time"
                        value={row.clockOut}
                        onChange={(event) =>
                          onTimeChange(selectedReport.employee.id, index, "clockOut", event.target.value)
                        }
                        className="min-h-[44px] w-28 rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-mono-brand font-semibold text-foreground">
                        {formatPayrollDuration(row.durationMinutes)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
              {hasDetailData ? (
                <tr className="bg-background/70">
                  <td className="px-5 py-4 font-bold text-foreground sm:px-6" colSpan={2}>
                    {selectedReport.name} TOTAL
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-text-muted sm:px-6">Summary</td>
                  <td className="px-5 py-4 font-mono-brand font-bold text-foreground sm:px-6">
                    {formatPayrollDuration(selectedReport.totalMinutes)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
