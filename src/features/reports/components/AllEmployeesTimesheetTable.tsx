"use client";

import { WorkspacePanel } from "@/components/manager/WorkspacePanel";
import { formatPayrollDuration } from "@/lib/time-calculation";
import { EmployeeReport } from "../types";
import { useIsPhoneWidth } from "../useIsPhoneWidth";

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
  const hasReports = reports.length > 0;
  const isPhoneWidth = useIsPhoneWidth();

  return (
    <WorkspacePanel
      eyebrow="Payroll table"
      title="All employee timesheets"
      description="Row-level review stays readable on desktop while touch-safe edits remain visible on phone widths."
      bodyClassName="p-0"
    >
      {isPhoneWidth ? (
        <div className="space-y-5 p-4 sm:p-5">
          {!hasReports ? (
            <div className="rounded-[22px] border border-dashed border-surfacestroke bg-background px-4 py-10 text-center text-sm font-medium text-text-muted">
              {emptyMessage}
            </div>
          ) : (
            reports.map((report) => (
              <section
                key={report.employee.id}
                className="space-y-4 rounded-[22px] border border-surfacestroke bg-background px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{report.name}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                      {report.timesheetRows.length} shift{report.timesheetRows.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                      Total
                    </p>
                    <p className="mt-1 font-mono-brand font-bold text-foreground">
                      {formatPayrollDuration(report.totalMinutes)}
                    </p>
                  </div>
                </div>

                {report.timesheetRows.length === 0 ? (
                  <p className="rounded-[18px] border border-dashed border-surfacestroke px-4 py-4 text-sm font-medium text-text-muted">
                    No shifts logged in this period.
                  </p>
                ) : (
                  report.timesheetRows.map((row, index) => (
                    <article
                      key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`}
                      className="space-y-4 rounded-[20px] border border-surfacestroke bg-surface px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                            Date
                          </p>
                          <p className="mt-1 font-semibold text-foreground">{row.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                            Duration
                          </p>
                          <p className="mt-1 font-mono-brand font-semibold text-foreground">
                            {formatPayrollDuration(row.durationMinutes)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <label className="grid gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                            Clock In
                          </span>
                          <input
                            type="time"
                            value={row.clockIn}
                            onChange={(event) =>
                              onTimeChange(report.employee.id, index, "clockIn", event.target.value)
                            }
                            className="min-h-[44px] w-full rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                            Clock Out
                          </span>
                          <input
                            type="time"
                            value={row.clockOut}
                            onChange={(event) =>
                              onTimeChange(report.employee.id, index, "clockOut", event.target.value)
                            }
                            className="min-h-[44px] w-full rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                          />
                        </label>
                      </div>

                      {row.note ? (
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-error">
                          {row.note}
                        </p>
                      ) : null}
                    </article>
                  ))
                )}
              </section>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-surfacestroke bg-background">
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted md:px-6">
                  Name
                </th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted md:px-6">
                  Date
                </th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted md:px-6">
                  Clock In
                </th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted md:px-6">
                  Clock Out
                </th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted md:px-6">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surfacestroke">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm font-medium text-text-muted md:px-6">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                reports.flatMap((report) => [
                  <tr key={`${report.employee.id}-label`} className="bg-background/70">
                    <td className="px-5 py-4 align-top md:px-6">
                      <p className="font-bold text-foreground">{report.name}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-text-muted md:px-6">Total</td>
                    <td className="px-5 py-4 md:px-6"></td>
                    <td className="px-5 py-4 md:px-6"></td>
                    <td className="px-5 py-4 md:px-6">
                      <p className="font-mono-brand font-bold text-foreground">
                        {formatPayrollDuration(report.totalMinutes)}
                      </p>
                    </td>
                  </tr>,
                  ...report.timesheetRows.map((row, index) => (
                    <tr
                      key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`}
                      className="transition-colors hover:bg-background"
                    >
                      <td className="px-5 py-4 align-top md:px-6"></td>
                      <td className="px-5 py-4 font-medium text-foreground md:px-6">{row.date}</td>
                      <td className="px-5 py-4 font-medium text-foreground md:px-6">
                        <input
                          type="time"
                          value={row.clockIn}
                          onChange={(event) =>
                            onTimeChange(report.employee.id, index, "clockIn", event.target.value)
                          }
                          className="min-h-[44px] w-28 rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                        />
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground md:px-6">
                        <input
                          type="time"
                          value={row.clockOut}
                          onChange={(event) =>
                            onTimeChange(report.employee.id, index, "clockOut", event.target.value)
                          }
                          className="min-h-[44px] w-28 rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                        />
                      </td>
                      <td className="px-5 py-4 md:px-6">
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
                ])
              )}
            </tbody>
          </table>
        </div>
      )}
    </WorkspacePanel>
  );
}
