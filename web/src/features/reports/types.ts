import { Employee } from "../../types";

export type MissingOutStrategy = "endOfDay" | "currentTime";
export type ShiftState = "closed" | "autoClosed" | "ongoing" | "managerOverride";
export interface ReportDraft {
  employeeId: string;
  clockInLogId: string;
  draftClockOutAt: string;
  savedAt: string;
}

export interface Shift {
  clockInLogId: string;
  clockOutLogId: string | null;
  in: Date;
  out: Date;
  durationMinutes: number;
  state: ShiftState;
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
  clockInLogId: string;
  clockOutLogId: string | null;
  date: string;
  clockIn: string;
  clockOut: string;
  durationMinutes: number;
  durationDisplay: string;
  clockInAt: Date;
  clockOutAt: Date;
  shiftState: ShiftState;
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
