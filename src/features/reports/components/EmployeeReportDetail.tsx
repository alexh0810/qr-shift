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
      <div className="bg-surface rounded-3xl shadow-sm border border-surfacestroke p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/45">
              Employee Summary
            </p>
            <h2 className="text-2xl font-bold text-foreground mt-2">
              {selectedReport?.name ?? "No data"}
            </h2>
            <p className="text-sm text-foreground/55 mt-1">
              {selectedReport
                ? `${selectedReport.dailySummaries.length} worked day(s) in selected period`
                : isValidSelection
                  ? "No shifts logged in this period."
                  : "Invalid employee selection."}
            </p>
          </div>

          <div className="min-w-full md:min-w-[320px]">
            <ReportSummaryCards
              totalHours={selectedReport?.totalHours ?? 0}
              durationLabel={formatPayrollDuration(selectedReport?.totalMinutes ?? 0)}
            />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-sm border border-surfacestroke overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfacestroke/50 border-b border-surfacestroke">
                <th className="p-4 font-semibold text-foreground/60">Date</th>
                <th className="p-4 font-semibold text-foreground/60">Clock In</th>
                <th className="p-4 font-semibold text-foreground/60">Clock Out</th>
                <th className="p-4 font-semibold text-foreground/60">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surfacestroke">
              {!hasDetailData ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-foreground/40 font-medium">
                    {employees.length === 0
                      ? "No employees available for this store."
                      : isValidSelection
                        ? "No data for this employee in the selected period."
                        : "Invalid employee selection."}
                  </td>
                </tr>
              ) : (
                selectedReport.timesheetRows.map((row, index) => (
                  <tr key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`} className="hover:bg-foreground/5 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-foreground">
                        {format(row.clockInAt, "EEE, MMM d, yyyy")}
                      </p>
                      {row.note ? (
                        <p className="text-[11px] font-bold text-error mt-1">{row.note}</p>
                      ) : null}
                    </td>
                    <td className="p-4 text-foreground/80 font-medium">
                      <input
                        type="time"
                        value={row.clockIn}
                        onChange={(event) =>
                          onTimeChange(selectedReport.employee.id, index, "clockIn", event.target.value)
                        }
                        className="w-24 rounded-xl border border-surfacestroke bg-background px-2 py-1 outline-none focus:border-primary"
                      />
                    </td>
                    <td className="p-4 text-foreground/80 font-medium">
                      <input
                        type="time"
                        value={row.clockOut}
                        onChange={(event) =>
                          onTimeChange(selectedReport.employee.id, index, "clockOut", event.target.value)
                        }
                        className="w-24 rounded-xl border border-surfacestroke bg-background px-2 py-1 outline-none focus:border-primary"
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">
                        {formatPayrollDuration(row.durationMinutes)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
              {hasDetailData ? (
                <tr className="bg-background/60">
                  <td className="p-4 font-bold text-foreground" colSpan={2}>
                    {selectedReport.name} TOTAL
                  </td>
                  <td className="p-4 text-foreground/60 font-semibold">Summary</td>
                  <td className="p-4 font-bold text-foreground">
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
