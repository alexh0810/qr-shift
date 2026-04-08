import { buildReportFileName, escapeCsvValue } from "../../lib/report-utils";
import { formatPayrollDuration } from "../../lib/time-calculation";
import { EmployeeReport, ReportSummary } from "./types";

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

  const rows: string[] = [["Name", "Date", "Clock In", "Clock Out", "Duration"].join(",")];

  for (const group of groupsToExport) {
    rows.push(
      [
        escapeCsvValue(`${group.name} TOTAL`),
        escapeCsvValue(""),
        escapeCsvValue(""),
        escapeCsvValue(""),
        escapeCsvValue(formatPayrollDuration(group.totalMinutes)),
      ].join(","),
    );

    for (const row of group.timesheetRows) {
      rows.push(
        [
          escapeCsvValue(""),
          escapeCsvValue(row.date),
          escapeCsvValue(row.clockIn),
          escapeCsvValue(row.clockOut),
          escapeCsvValue(formatPayrollDuration(row.durationMinutes)),
        ].join(","),
      );
    }

    rows.push(
      [
        escapeCsvValue(`${group.name} SUBTOTAL`),
        escapeCsvValue(""),
        escapeCsvValue(""),
        escapeCsvValue(""),
        escapeCsvValue(formatPayrollDuration(group.totalMinutes)),
      ].join(","),
    );
    rows.push(["", "", "", "", ""].map(escapeCsvValue).join(","));
  }

  rows.push(
    [
      escapeCsvValue(selectedEmployeeId === "ALL" ? "TOTAL HOURS (ALL EMPLOYEES)" : `${activeReport?.name ?? "Employee"} TOTAL`),
      escapeCsvValue(""),
      escapeCsvValue(""),
      escapeCsvValue(""),
      escapeCsvValue(
        selectedEmployeeId === "ALL"
          ? formatPayrollDuration(globalSummary.totalMinutes)
          : formatPayrollDuration(activeReport?.totalMinutes ?? 0),
      ),
    ].join(","),
  );

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
