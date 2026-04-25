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
      title="All Employee Timesheets"
      description={hasReports ? `${reports.length} employee${reports.length === 1 ? "" : "s"} with logged shifts` : undefined}
      bodyClassName="p-0"
    >
      {isPhoneWidth ? (
        <div className="space-y-4 p-4">
          {!hasReports ? (
            <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-muted">
              {emptyMessage}
            </div>
          ) : (
            reports.map((report) => (
              <section
                key={report.employee.id}
                className="space-y-3 rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light font-display text-sm font-semibold text-primary">
                      {report.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground">{report.name}</p>
                      <p className="text-sm text-muted">
                        {report.timesheetRows.length} shift{report.timesheetRows.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Total</p>
                    <p className="font-display text-lg font-bold text-foreground">
                      {formatPayrollDuration(report.totalMinutes)}
                    </p>
                  </div>
                </div>

                {report.timesheetRows.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted">
                    No shifts logged in this period.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {report.timesheetRows.map((row, index) => (
                      <article
                        key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`}
                        className="rounded-lg border border-border bg-surface p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="font-medium text-foreground">{row.date}</p>
                          <p className="font-display font-semibold text-foreground">
                            {formatPayrollDuration(row.durationMinutes)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="space-y-1.5">
                            <span className="text-xs font-medium text-muted">Clock In</span>
                            <input
                              type="time"
                              value={row.clockIn}
                              onChange={(event) =>
                                onTimeChange(report.employee.id, index, "clockIn", event.target.value)
                              }
                              className="h-10 w-full rounded-lg border border-border bg-background px-3 font-display text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </label>

                          <label className="space-y-1.5">
                            <span className="text-xs font-medium text-muted">Clock Out</span>
                            <input
                              type="time"
                              value={row.clockOut}
                              onChange={(event) =>
                                onTimeChange(report.employee.id, index, "clockOut", event.target.value)
                              }
                              className="h-10 w-full rounded-lg border border-border bg-background px-3 font-display text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </label>
                        </div>

                        {row.note ? (
                          <p className="mt-2 text-xs font-medium text-error">{row.note}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-5 py-3 text-xs font-semibold text-muted">Employee</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted">Clock In</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted">Clock Out</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                reports.flatMap((report) => [
                  <tr key={`${report.employee.id}-label`} className="bg-primary-light/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light font-display text-xs font-semibold text-primary">
                          {report.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-display font-semibold text-foreground">{report.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted">
                      {report.timesheetRows.length} shift{report.timesheetRows.length === 1 ? "" : "s"}
                    </td>
                    <td className="px-5 py-3"></td>
                    <td className="px-5 py-3 text-sm text-muted">Total</td>
                    <td className="px-5 py-3">
                      <span className="font-display font-bold text-foreground">
                        {formatPayrollDuration(report.totalMinutes)}
                      </span>
                    </td>
                  </tr>,
                  ...report.timesheetRows.map((row, index) => (
                    <tr
                      key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`}
                      className="transition-colors hover:bg-surface/50"
                    >
                      <td className="px-5 py-3"></td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-foreground">{row.date}</span>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="time"
                          value={row.clockIn}
                          onChange={(event) =>
                            onTimeChange(report.employee.id, index, "clockIn", event.target.value)
                          }
                          className="h-9 w-28 rounded-lg border border-border bg-background px-3 font-display text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="time"
                          value={row.clockOut}
                          onChange={(event) =>
                            onTimeChange(report.employee.id, index, "clockOut", event.target.value)
                          }
                          className="h-9 w-28 rounded-lg border border-border bg-background px-3 font-display text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-display font-semibold text-foreground">
                          {formatPayrollDuration(row.durationMinutes)}
                        </span>
                        {row.note ? (
                          <p className="mt-0.5 text-xs font-medium text-error">{row.note}</p>
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
