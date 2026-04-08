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
    <div className="bg-surface rounded-3xl shadow-sm border border-surfacestroke overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surfacestroke/50 border-b border-surfacestroke">
              <th className="p-4 font-semibold text-foreground/60">Name</th>
              <th className="p-4 font-semibold text-foreground/60">Date</th>
              <th className="p-4 font-semibold text-foreground/60">Clock In</th>
              <th className="p-4 font-semibold text-foreground/60">Clock Out</th>
              <th className="p-4 font-semibold text-foreground/60">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surfacestroke">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-foreground/40 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              reports.flatMap((report) => [
                <tr key={`${report.employee.id}-label`} className="bg-background/60">
                  <td className="p-4 align-top">
                    <p className="font-bold text-foreground">{report.name}</p>
                    <p className="text-xs text-foreground/50">
                      {formatPayrollDuration(report.totalMinutes)} for this period
                    </p>
                  </td>
                  <td colSpan={4} className="p-4 text-sm text-foreground/50">
                    Timesheet entries for selected period
                  </td>
                </tr>,
                ...report.timesheetRows.map((row, index) => (
                  <tr key={`${row.employeeId}-${row.date}-${row.clockIn}-${index}`} className="hover:bg-foreground/5 transition-colors">
                    <td className="p-4 align-top"></td>
                    <td className="p-4 text-foreground/80 font-medium">{row.date}</td>
                    <td className="p-4 text-foreground/80 font-medium">
                      <input
                        type="time"
                        value={row.clockIn}
                        onChange={(event) =>
                          onTimeChange(report.employee.id, index, "clockIn", event.target.value)
                        }
                        className="w-24 rounded-xl border border-surfacestroke bg-background px-2 py-1 outline-none focus:border-primary"
                      />
                    </td>
                    <td className="p-4 text-foreground/80 font-medium">
                      <input
                        type="time"
                        value={row.clockOut}
                        onChange={(event) =>
                          onTimeChange(report.employee.id, index, "clockOut", event.target.value)
                        }
                        className="w-24 rounded-xl border border-surfacestroke bg-background px-2 py-1 outline-none focus:border-primary"
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">
                        {formatPayrollDuration(row.durationMinutes)}
                      </p>
                      {row.note ? (
                        <p className="text-[11px] font-bold text-error mt-1">{row.note}</p>
                      ) : null}
                    </td>
                  </tr>
                )),
                <tr key={`${report.employee.id}-subtotal`} className="bg-background/60">
                  <td className="p-4 font-bold text-foreground" colSpan={3}>
                    {report.name} TOTAL
                  </td>
                  <td className="p-4 text-foreground/60 font-semibold">Subtotal</td>
                  <td className="p-4">
                    <p className="font-bold text-foreground">
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
