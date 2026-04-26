import assert from "node:assert/strict";

import { buildReportsCsv } from "../features/reports/export";
import type { EmployeeReport, ReportSummary } from "../features/reports/types";

type TestCase = {
  name: string;
  run: () => void;
};

function at(value: string): Date {
  return new Date(value);
}

const kimReport: EmployeeReport = {
  employee: {
    id: "emp-1",
    name: "Kim",
    store_id: "store-1",
    created_at: at("2026-01-01T00:00:00"),
  },
  name: "Kim",
  totalMinutes: 137,
  totalHours: 2.28,
  display: "2h 17m",
  shifts: [],
  dailySummaries: [
    {
      date: at("2026-04-22T00:00:00"),
      dateKey: "2026-04-22",
      shifts: [],
      totalMinutes: 137,
      totalHours: 2.28,
      display: "2h 17m",
    },
  ],
  timesheetRows: [
    {
      employeeId: "emp-1",
      employeeName: "Kim",
      clockInLogId: "kim-in-1",
      clockOutLogId: "kim-out-1",
      date: "2026-04-22",
      clockIn: "19:30",
      clockOut: "19:35",
      durationMinutes: 5,
      durationDisplay: "0.08 h (0h 5m)",
      clockInAt: at("2026-04-22T19:30:00"),
      clockOutAt: at("2026-04-22T19:35:00"),
      shiftState: "closed",
    },
    {
      employeeId: "emp-1",
      employeeName: "Kim",
      clockInLogId: "kim-in-2",
      clockOutLogId: "kim-out-2",
      date: "2026-04-22",
      clockIn: "19:38",
      clockOut: "21:50",
      durationMinutes: 132,
      durationDisplay: "2.20 h (2h 12m)",
      clockInAt: at("2026-04-22T19:38:00"),
      clockOutAt: at("2026-04-22T21:50:00"),
      shiftState: "closed",
    },
  ],
};

const alexReport: EmployeeReport = {
  employee: {
    id: "emp-2",
    name: "Alex",
    store_id: "store-1",
    created_at: at("2026-01-01T00:00:00"),
  },
  name: "Alex",
  totalMinutes: 480,
  totalHours: 8,
  display: "8h 0m",
  shifts: [],
  dailySummaries: [
    {
      date: at("2026-04-23T00:00:00"),
      dateKey: "2026-04-23",
      shifts: [],
      totalMinutes: 480,
      totalHours: 8,
      display: "8h 0m",
    },
  ],
  timesheetRows: [
    {
      employeeId: "emp-2",
      employeeName: "Alex",
      clockInLogId: "alex-in-1",
      clockOutLogId: "alex-out-1",
      date: "2026-04-23",
      clockIn: "09:00",
      clockOut: "17:00",
      durationMinutes: 480,
      durationDisplay: "8.00 h (8h 0m)",
      clockInAt: at("2026-04-23T09:00:00"),
      clockOutAt: at("2026-04-23T17:00:00"),
      shiftState: "closed",
    },
  ],
};

const ongoingReport: EmployeeReport = {
  employee: {
    id: "emp-3",
    name: "Alex",
    store_id: "store-1",
    created_at: at("2026-01-01T00:00:00"),
  },
  name: "Alex",
  totalMinutes: 180,
  totalHours: 3,
  display: "3h 0m",
  shifts: [],
  dailySummaries: [
    {
      date: at("2026-04-25T00:00:00"),
      dateKey: "2026-04-25",
      shifts: [],
      totalMinutes: 180,
      totalHours: 3,
      display: "3h 0m",
    },
  ],
  timesheetRows: [
    {
      employeeId: "emp-3",
      employeeName: "Alex",
      clockInLogId: "ongoing-in-1",
      clockOutLogId: null,
      date: "2026-04-25",
      clockIn: "12:00",
      clockOut: "15:00",
      durationMinutes: 180,
      durationDisplay: "3.00 h (3h 0m)",
      clockInAt: at("2026-04-25T12:00:00"),
      clockOutAt: at("2026-04-25T15:00:00"),
      shiftState: "ongoing",
      note: "Ongoing",
    },
  ],
};

const globalSummary: ReportSummary = {
  totalMinutes: 617,
  totalHours: 10.28,
  totalHoursDecimal: 10.28,
  display: "10h 17m",
};

const tests: TestCase[] = [
  {
    name: "builds payroll-friendly CSV with one employee summary row",
    run: () => {
      const result = buildReportsCsv(
        [kimReport],
        globalSummary,
        kimReport.employee.id,
        "Demo Payroll Store",
        "2026-04-20",
        "2026-04-26",
      );

      assert.ok(result);
      const lines = result!.content.split("\n");

      assert.equal(
        lines[0],
        '"Employee Name","Work Day","Clock In","Clock Out","Shift Duration","Total Hours Worked","Days Worked"',
      );
      assert.equal(
        lines[1],
        '"Kim","22-04-2026","19:30","19:35","0.08 h (0h 5m)","",""',
      );
      assert.equal(
        lines[2],
        '"Kim","22-04-2026","19:38","21:50","2.20 h (2h 12m)","",""',
      );
      assert.equal(
        lines[3],
        '"Kim","Summary","","","","2.28 h (2h 17m)","1"',
      );
      assert.ok(!result!.content.includes("SUBTOTAL"));
      assert.ok(!result!.content.includes(" TOTAL"));
    },
  },
  {
    name: "builds all-employees CSV with per-employee summaries and one final workbook summary",
    run: () => {
      const result = buildReportsCsv(
        [kimReport, alexReport],
        globalSummary,
        "ALL",
        "Demo Payroll Store",
        "2026-04-20",
        "2026-04-26",
      );

      assert.ok(result);
      const lines = result!.content.split("\n");

      assert.ok(lines.includes('"Kim","Summary","","","","2.28 h (2h 17m)","1"'));
      assert.ok(lines.includes('"Alex","Summary","","","","8.00 h (8h 0m)","1"'));
      assert.equal(
        lines[lines.length - 1],
        '"All Employees","Summary","","","","10.28 h (10h 17m)",""',
      );
    },
  },
  {
    name: "marks same-day ongoing shifts clearly in CSV exports",
    run: () => {
      const result = buildReportsCsv(
        [ongoingReport],
        {
          totalMinutes: 180,
          totalHours: 3,
          totalHoursDecimal: 3,
          display: "3h 0m",
        },
        ongoingReport.employee.id,
        "Demo Payroll Store",
        "2026-04-01",
        "2026-04-25",
      );

      assert.ok(result);
      const lines = result!.content.split("\n");

      assert.equal(
        lines[1],
        '"Alex","25-04-2026","12:00","Ongoing","3.00 h (3h 0m)","",""',
      );
    },
  },
];

let failed = 0;

for (const currentTest of tests) {
  try {
    currentTest.run();
    console.log(`PASS ${currentTest.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${currentTest.name}`);
    console.error(error);
  }
}

if (failed > 0) {
  process.exitCode = 1;
  throw new Error(`${failed} report export test(s) failed`);
}

console.log(`Passed ${tests.length} report export tests`);
