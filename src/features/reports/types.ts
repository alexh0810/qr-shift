import { Employee } from "../../types";

export type MissingOutStrategy = "endOfDay" | "currentTime";

export interface Shift {
  in: Date;
  out: Date;
  durationMinutes: number;
  note?: string;
}

export interface Summary {
  totalMinutes: number;
  totalHours: number;
  display: string;
}

export interface DailyShiftSummary extends Summary {
  date: Date;
  dateKey: string;
  shifts: Shift[];
}

export interface TimesheetRow {
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  durationMinutes: number;
  durationDisplay: string;
  clockInAt: Date;
  clockOutAt: Date;
  note?: string;
}

export interface EmployeeReport extends Summary {
  employee: Employee;
  name: string;
  shifts: Shift[];
  dailySummaries: DailyShiftSummary[];
  timesheetRows: TimesheetRow[];
}

export interface ReportSummary extends Summary {
  totalHoursDecimal: number;
}

export interface ReportData {
  employeeGroups: EmployeeReport[];
  rows: TimesheetRow[];
  globalSummary: ReportSummary;
}

export interface ReportCalculationOptions {
  missingOutStrategy?: MissingOutStrategy;
  currentTime?: Date;
  minimumShiftMilliseconds?: number;
  rangeStart?: Date;
  rangeEnd?: Date;
}
