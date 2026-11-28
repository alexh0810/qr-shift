import { format } from "date-fns";
import { buildReportFileName, escapeCsvValue } from "../../lib/report-utils";
import { formatPayrollDuration } from "../../lib/time-calculation";
import { EmployeeReport, ReportSummary } from "./types";

const LOCATION_LABELS = { inside: "Inside", outside: "Outside", unknown: "Unknown" } as const;

export function buildReportsCsv(
  reports: EmployeeReport[],
  globalSummary: ReportSummary,
  selectedEmployeeId: "ALL" | string,
  storeName: string | undefined,
  startDate: string,
  endDate: string,
): { content: string; fileName: string } | null {
  if (reports.length === 0) {
    return null;
  }

  const activeReport =
    selectedEmployeeId === "ALL"
      ? null
      : reports.find((report) => report.employee.id === selectedEmployeeId) ?? null;
  const groupsToExport =
    selectedEmployeeId === "ALL"
      ? reports
      : activeReport
        ? [activeReport]
        : [];

  const rows: string[] = [
    [
      "Employee Name",
      "Work Day",
      "Clock In",
      "Clock Out",
      "Shift Duration",
      "Total Hours Worked",
      "Days Worked",
      "Location",
      "Edited",
    ]
      .map(escapeCsvValue)
      .join(","),
  ];

  for (const group of groupsToExport) {
    for (const row of group.timesheetRows) {
      const exportedClockOut = row.shiftState === "ongoing" ? "Ongoing" : row.clockOut;

      rows.push(
        [
          escapeCsvValue(group.name),
          escapeCsvValue(format(row.clockInAt, "dd-MM-yyyy")),
          escapeCsvValue(row.clockIn),
          escapeCsvValue(exportedClockOut),
          escapeCsvValue(row.durationDisplay),
          escapeCsvValue(""),
          escapeCsvValue(""),
          escapeCsvValue(row.locationStatus ? LOCATION_LABELS[row.locationStatus] : ""),
          escapeCsvValue(row.edits?.length ? "Yes" : ""),
        ].join(","),
      );
    }

    rows.push(
      [
        escapeCsvValue(group.name),
        escapeCsvValue("Summary"),
        escapeCsvValue(""),
        escapeCsvValue(""),
        escapeCsvValue(""),
        escapeCsvValue(formatPayrollDuration(group.totalMinutes)),
        escapeCsvValue(String(group.dailySummaries.length)),
        escapeCsvValue(""),
        escapeCsvValue(""),
      ].join(","),
    );
    rows.push(["", "", "", "", "", "", "", "", ""].map(escapeCsvValue).join(","));
  }

  if (selectedEmployeeId === "ALL") {
    rows.push(
      [
        escapeCsvValue("All Employees"),
        escapeCsvValue("Summary"),
        escapeCsvValue(""),
        escapeCsvValue(""),
        escapeCsvValue(""),
        escapeCsvValue(formatPayrollDuration(globalSummary.totalMinutes)),
        escapeCsvValue(""),
        escapeCsvValue(""),
        escapeCsvValue(""),
      ].join(","),
    );
  }

  const baseFileName = buildReportFileName(storeName, startDate, endDate);
  const fileName =
    selectedEmployeeId === "ALL"
      ? `${baseFileName}_Timesheet.csv`
      : `${baseFileName}_${activeReport?.name.replace(/ /g, "_") ?? "Employee"}.csv`;

  return {
    content: rows.join("\n"),
    fileName,
  };
}
