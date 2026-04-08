import { Employee, Timelog } from "../../types";
import {
  applyTimeValue,
  calculateDurationMinutes,
  clampRange,
  createTotals,
  DEFAULT_MINIMUM_SHIFT_MILLISECONDS,
  formatPayrollDuration,
  formatTime,
  getLocalDateKey,
  roundHours,
} from "../../lib/time-calculation";
import {
  DailyShiftSummary,
  EmployeeReport,
  MissingOutStrategy,
  ReportCalculationOptions,
  ReportData,
  ReportSummary,
  Shift,
  Summary,
  TimesheetRow,
} from "./types";

function resolveOpenShiftEnd(
  clockInTime: Date,
  strategy: MissingOutStrategy,
  currentTime: Date,
): { out: Date; note: string } {
  if (strategy === "currentTime") {
    return {
      out: currentTime,
      note: "Auto-closed at current time",
    };
  }

  const endOfPayrollDay = new Date(clockInTime);
  endOfPayrollDay.setHours(23, 59, 0, 0);

  return {
    out: endOfPayrollDay,
    note: "Auto-closed at end of day",
  };
}

function buildDailySummaries(shifts: Shift[]): DailyShiftSummary[] {
  const days = new Map<string, Shift[]>();

  for (const shift of shifts) {
    const dateKey = getLocalDateKey(shift.in);
    const existing = days.get(dateKey);
    if (existing) {
      existing.push(shift);
    } else {
      days.set(dateKey, [shift]);
    }
  }

  return Array.from(days.entries())
    .map(([dateKey, dayShifts]): DailyShiftSummary => {
      const totalMinutes = dayShifts.reduce((sum, shift) => sum + shift.durationMinutes, 0);
      return {
        date: new Date(dayShifts[0].in),
        dateKey,
        shifts: [...dayShifts].sort((left, right) => left.in.getTime() - right.in.getTime()),
        ...createTotals(totalMinutes),
      };
    })
    .sort((left, right) => left.date.getTime() - right.date.getTime());
}

function buildTimesheetRows(employee: Employee, shifts: Shift[]): TimesheetRow[] {
  return [...shifts]
    .sort((left, right) => left.in.getTime() - right.in.getTime())
    .map((shift) => ({
      employeeId: employee.id,
      employeeName: employee.name,
      date: getLocalDateKey(shift.in),
      clockIn: formatTime(shift.in),
      clockOut: formatTime(shift.out),
      durationMinutes: Math.floor(shift.durationMinutes),
      durationDisplay: formatPayrollDuration(shift.durationMinutes),
      clockInAt: shift.in,
      clockOutAt: shift.out,
      note: shift.note,
    }));
}

function summarizeMinutes(totalMinutes: number): ReportSummary {
  const totals = createTotals(totalMinutes);
  return {
    ...totals,
    totalHoursDecimal: roundHours(totalMinutes),
  };
}

function rowToShift(row: TimesheetRow): Shift {
  return {
    in: row.clockInAt,
    out: row.clockOutAt,
    durationMinutes: row.durationMinutes,
    note: row.note,
  };
}

export function calculateReportFromLogs(
  logs: Timelog[],
  options: ReportCalculationOptions = {},
): { shifts: Shift[] } & Summary {
  const {
    missingOutStrategy = "endOfDay",
    currentTime = new Date(),
    minimumShiftMilliseconds = DEFAULT_MINIMUM_SHIFT_MILLISECONDS,
    rangeStart,
    rangeEnd,
  } = options;

  const sortedLogs = [...logs].sort(
    (left, right) => left.timestamp.getTime() - right.timestamp.getTime(),
  );

  const shifts: Shift[] = [];
  let openClockIn: Date | null = null;

  const pushShift = (start: Date, end: Date, note?: string) => {
    const bounded = clampRange(start, end, rangeStart, rangeEnd);
    if (!bounded) {
      return;
    }

    const durationMinutes = calculateDurationMinutes(bounded.start, bounded.end);
    if (durationMinutes * 60 * 1000 < minimumShiftMilliseconds) {
      return;
    }

    shifts.push({
      in: bounded.start,
      out: bounded.end,
      durationMinutes,
      note,
    });
  };

  for (const log of sortedLogs) {
    if (log.type === "IN") {
      openClockIn = log.timestamp;
      continue;
    }

    if (!openClockIn || log.timestamp <= openClockIn) {
      continue;
    }

    pushShift(openClockIn, log.timestamp);
    openClockIn = null;
  }

  if (openClockIn) {
    const fallback = resolveOpenShiftEnd(openClockIn, missingOutStrategy, currentTime);
    if (fallback.out > openClockIn) {
      pushShift(openClockIn, fallback.out, fallback.note);
    }
  }

  const totalMinutes = shifts.reduce((sum, shift) => sum + shift.durationMinutes, 0);
  return {
    shifts,
    ...createTotals(totalMinutes),
  };
}

export function buildEmployeeReports(
  employees: Employee[],
  logs: Timelog[],
  options: ReportCalculationOptions = {},
): EmployeeReport[] {
  const logsByEmployee = new Map<string, Timelog[]>();

  for (const log of logs) {
    const existing = logsByEmployee.get(log.employee_id);
    if (existing) {
      existing.push(log);
    } else {
      logsByEmployee.set(log.employee_id, [log]);
    }
  }

  return employees
    .map((employee) => {
      const summary = calculateReportFromLogs(logsByEmployee.get(employee.id) ?? [], options);
      return {
        employee,
        name: employee.name,
        shifts: summary.shifts,
        dailySummaries: buildDailySummaries(summary.shifts),
        timesheetRows: buildTimesheetRows(employee, summary.shifts),
        totalMinutes: summary.totalMinutes,
        totalHours: summary.totalHours,
        display: summary.display,
      };
    })
    .filter((report) => report.shifts.length > 0)
    .sort((left, right) => {
      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) {
        return byName;
      }
      const leftFirst = left.shifts[0]?.in.getTime() ?? 0;
      const rightFirst = right.shifts[0]?.in.getTime() ?? 0;
      return leftFirst - rightFirst;
    });
}

export function buildReportData(
  employees: Employee[],
  logs: Timelog[],
  options: ReportCalculationOptions = {},
): ReportData {
  const employeeGroups = buildEmployeeReports(employees, logs, options);
  const rows = employeeGroups
    .flatMap((group) => group.timesheetRows)
    .sort((left, right) => {
      const byName = left.employeeName.localeCompare(right.employeeName);
      if (byName !== 0) {
        return byName;
      }
      const byDate = left.date.localeCompare(right.date);
      if (byDate !== 0) {
        return byDate;
      }
      return left.clockInAt.getTime() - right.clockInAt.getTime();
    });

  return {
    employeeGroups,
    rows,
    globalSummary: summarizeEmployeeReports(employeeGroups),
  };
}

export function rebuildEmployeeReport(employee: Employee, rows: TimesheetRow[]): EmployeeReport {
  const sortedRows = [...rows].sort((left, right) => left.clockInAt.getTime() - right.clockInAt.getTime());
  const shifts = sortedRows.map(rowToShift);
  const totalMinutes = shifts.reduce((sum, shift) => sum + shift.durationMinutes, 0);

  return {
    employee,
    name: employee.name,
    shifts,
    dailySummaries: buildDailySummaries(shifts),
    timesheetRows: sortedRows,
    ...createTotals(totalMinutes),
  };
}

export function summarizeEmployeeReports(employeeGroups: EmployeeReport[]): ReportSummary {
  const totalMinutes = employeeGroups.reduce((sum, report) => sum + report.totalMinutes, 0);
  return summarizeMinutes(totalMinutes);
}

export function updateRowTime(
  row: TimesheetRow,
  field: "clockIn" | "clockOut",
  value: string,
): TimesheetRow {
  const baseDate = field === "clockIn" ? row.clockInAt : row.clockOutAt;
  const updatedDate = applyTimeValue(baseDate, value);
  if (!updatedDate) {
    return row;
  }

  const nextClockInAt = field === "clockIn" ? updatedDate : new Date(row.clockInAt);
  const nextClockOutAt = field === "clockOut" ? updatedDate : new Date(row.clockOutAt);
  const nextDurationMinutes = Math.max(
    0,
    Math.round(calculateDurationMinutes(nextClockInAt, nextClockOutAt)),
  );

  return {
    ...row,
    clockIn: field === "clockIn" ? value : row.clockIn,
    clockOut: field === "clockOut" ? value : row.clockOut,
    clockInAt: nextClockInAt,
    clockOutAt: nextClockOutAt,
    durationMinutes: nextDurationMinutes,
    durationDisplay: formatPayrollDuration(nextDurationMinutes),
    note: nextDurationMinutes === 0 ? "Check corrected times" : row.note,
  };
}
