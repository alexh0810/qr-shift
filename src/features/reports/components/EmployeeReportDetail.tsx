"use client";

import { format } from "date-fns";

import { WorkspacePanel } from "@/components/manager/WorkspacePanel";
import { formatPayrollDuration } from "@/lib/time-calculation";
import { Employee } from "@/types";
import { EditableTimeInput } from "./EditableTimeInput";
import { EmployeeReport, TimesheetRow } from "../types";
import { useIsPhoneWidth } from "../useIsPhoneWidth";

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

function rowStatusClassName(row: TimesheetRow): string {
  return row.shiftState === "autoClosed"
    ? "text-[11px] font-bold uppercase tracking-[0.18em] text-error"
    : "text-[11px] font-bold uppercase tracking-[0.18em] text-primary";
}

export function EmployeeReportDetail({
  employees,
  selectedEmployeeId,
  selectedReport,
  onTimeChange,
}: EmployeeReportDetailProps) {
  const hasDetailData = !!selectedReport && selectedReport.timesheetRows.length > 0;
  const isValidSelection = employees.some((employee) => employee.id === selectedEmployeeId);
  const isPhoneWidth = useIsPhoneWidth();
  const mobileEmptyMessage =
    employees.length === 0
      ? "No employees available for this store."
      : isValidSelection
        ? "No data for this employee in the selected period."
        : "Invalid employee selection.";

  return (
    <WorkspacePanel
      title="Timesheet"
      bodyClassName="p-0"
      className={isPhoneWidth ? "rounded-[24px]" : ""}
    >
        {isPhoneWidth ? (
          <div className="space-y-4 p-3">
            {!hasDetailData || !selectedReport ? (
              <div className="rounded-[22px] border border-dashed border-surfacestroke bg-background px-4 py-10 text-center text-sm font-medium text-text-muted">
                {mobileEmptyMessage}
              </div>
            ) : (
              <>
                {selectedReport.timesheetRows.map((row, index) => (
                  <article
                    key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`}
                    className="space-y-4 rounded-[18px] border border-surfacestroke bg-background px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                          Date
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {format(row.clockInAt, "dd-MM-yyyy")}
                        </p>
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
                        <EditableTimeInput
                          value={row.clockIn}
                          onCommit={(value) => onTimeChange(selectedReport.employee.id, index, "clockIn", value)}
                          className="min-h-[44px] w-full rounded-[16px] border border-surfacestroke bg-surface px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                          Clock Out
                        </span>
                        <EditableTimeInput
                          value={row.clockOut}
                          onCommit={(value) => onTimeChange(selectedReport.employee.id, index, "clockOut", value)}
                          className="min-h-[44px] w-full rounded-[16px] border border-surfacestroke bg-surface px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                        />
                      </label>
                    </div>

                    {row.note ? (
                      <p className={rowStatusClassName(row)}>
                        {row.note}
                      </p>
                    ) : null}
                  </article>
                ))}

                <div className="flex items-center justify-between gap-3 rounded-[20px] border border-surfacestroke bg-background px-4 py-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                      Total
                    </p>
                    <p className="mt-1 font-semibold text-foreground">{selectedReport.name}</p>
                  </div>
                  <p className="font-mono-brand font-bold text-foreground">
                    {formatPayrollDuration(selectedReport.totalMinutes)}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full border-collapse text-left">
              <thead>
                <tr className="border-y border-surfacestroke bg-background">
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
                {!hasDetailData ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm font-medium text-text-muted md:px-6">
                      {mobileEmptyMessage}
                    </td>
                  </tr>
                ) : (
                  selectedReport.timesheetRows.map((row, index) => (
                    <tr
                      key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`}
                      className="transition-colors hover:bg-background"
                    >
                      <td className="px-5 py-4 md:px-6">
                        <p className="font-semibold text-foreground">
                          {format(row.clockInAt, "dd-MM-yyyy")}
                        </p>
                        {row.note ? (
                          <p className={`mt-1 ${rowStatusClassName(row)}`}>
                            {row.note}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground md:px-6">
                        <EditableTimeInput
                          value={row.clockIn}
                          onCommit={(value) => onTimeChange(selectedReport.employee.id, index, "clockIn", value)}
                          className="min-h-[44px] w-28 rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                        />
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground md:px-6">
                        <EditableTimeInput
                          value={row.clockOut}
                          onCommit={(value) => onTimeChange(selectedReport.employee.id, index, "clockOut", value)}
                          className="min-h-[44px] w-28 rounded-[16px] border border-surfacestroke bg-background px-3 py-2 font-mono-brand text-sm outline-none focus:border-primary"
                        />
                      </td>
                      <td className="px-5 py-4 md:px-6">
                        <p className="font-mono-brand font-semibold text-foreground">
                          {formatPayrollDuration(row.durationMinutes)}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
                {hasDetailData ? (
                  <tr className="bg-background/70">
                    <td className="px-5 py-4 font-bold text-foreground md:px-6" colSpan={3}>
                      Total
                    </td>
                    <td className="px-5 py-4 font-mono-brand font-bold text-foreground md:px-6">
                      {formatPayrollDuration(selectedReport.totalMinutes)}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
    </WorkspacePanel>
  );
}
