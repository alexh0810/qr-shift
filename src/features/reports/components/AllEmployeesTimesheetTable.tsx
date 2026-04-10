"use client";

import { formatPayrollDuration } from "@/lib/time-calculation";
import { EmployeeReport } from "../types";

interface AllEmployeesTimesheetTableProps {
  reports: EmployeeReport[];
  emptyMessage: string;
  onTimeChange: (
    employeeId: string,
    rowIndex: number,
    field: "clockIn" | "clockOut",
    value: string,
  ) => void;
}

export function AllEmployeesTimesheetTable({
  reports,
  emptyMessage,
  onTimeChange,
}: AllEmployeesTimesheetTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-surfacestroke bg-surface shadow-[var(--shadow-panel)]">
      <div className="flex flex-col gap-2 border-b border-surfacestroke px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
            Payroll table
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-[-0.04em] text-foreground">
            All employee timesheets
          </h3>
        </div>
        <p className="text-sm font-medium text-text-muted">
          Review and adjust local export rows for the selected range.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-surfacestroke bg-background">
              <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted sm:px-6">Name</th>
              <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted sm:px-6">Date</th>
              <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted sm:px-6">Clock In</th>
              <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted sm:px-6">Clock Out</th>
              <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted sm:px-6">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surfacestroke">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm font-medium text-text-muted sm:px-6">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              reports.flatMap((report) => [
                <tr key={`${report.employee.id}-label`} className="bg-background/70">
                  <td className="px-5 py-4 align-top sm:px-6">
                    <p className="font-bold text-foreground">{report.name}</p>
                    <p className="text-xs text-text-muted">
                      {formatPayrollDuration(report.totalMinutes)} for this period
                    </p>
                  </td>
                  <td colSpan={4} className="px-5 py-4 text-sm font-medium text-text-muted sm:px-6">
                    Timesheet entries for selected period
                  </td>
                </tr>,
                ...report.timesheetRows.map((row, index) => (
                  <tr key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`} className="transition-colors hover:bg-background">
                    <td className="px-5 py-4 align-top sm:px-6"></td>
                    <td className="px-5 py-4 font-medium text-foreground sm:px-6">{row.date}</td>
                    <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                      <input
                        type="time"
                        value={row.clockIn}
                        onChange={(event) =>
                          onTimeChange(report.employee.id, index, "clockIn", event.target.value)
                        }
                        className="min-h-[44px] w-28 rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                      <input
                        type="time"
                        value={row.clockOut}
                        onChange={(event) =>
                          onTimeChange(report.employee.id, index, "clockOut", event.target.value)
                        }
                        className="min-h-[44px] w-28 rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-mono-brand font-semibold text-foreground">
                        {formatPayrollDuration(row.durationMinutes)}
                      </p>
                      {row.note ? (
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-error">
                          {row.note}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                )),
                <tr key={`${report.employee.id}-subtotal`} className="bg-background/70">
                  <td className="px-5 py-4 font-bold text-foreground sm:px-6" colSpan={3}>
                    {report.name} TOTAL
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-text-muted sm:px-6">Subtotal</td>
                  <td className="px-5 py-4 sm:px-6">
                    <p className="font-mono-brand font-bold text-foreground">
                      {formatPayrollDuration(report.totalMinutes)}
                    </p>
                  </td>
                </tr>,
              ])
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
