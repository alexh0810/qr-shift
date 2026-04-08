import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import { buildEmployeePayrollReports, buildPayrollTimesheet, calculatePayrollFromLogs } from "./payroll";
import { buildDemoStoreSeed } from "./demoData";
import { Employee, Timelog } from "../types";

type TestCase = {
  name: string;
  run: () => void;
};

function at(value: string): Date {
  return new Date(value);
}

function makeLog(
  employeeId: string,
  type: "IN" | "OUT",
  timestamp: string,
  id = `${employeeId}-${type}-${timestamp}`,
): Timelog {
  return {
    id,
    employee_id: employeeId,
    store_id: "store-1",
    type,
    timestamp: at(timestamp),
  };
}

const employee: Employee = {
  id: "emp-1",
  name: "Alex",
  store_id: "store-1",
  created_at: at("2026-01-01T00:00:00"),
};

const secondEmployee: Employee = {
  id: "emp-2",
  name: "Kim",
  store_id: "store-1",
  created_at: at("2026-01-01T00:00:00"),
};

const tests: TestCase[] = [
  {
    name: "calculates a basic IN/OUT shift in decimal hours",
    run: () => {
      const result = calculatePayrollFromLogs([
        makeLog("emp-1", "IN", "2026-04-01T08:00:00"),
        makeLog("emp-1", "OUT", "2026-04-01T16:30:00"),
      ]);

      assert.equal(result.totalMinutes, 510);
      assert.equal(result.totalHours, 8.5);
      assert.equal(result.display, "8h 30m");
      assert.equal(result.shifts.length, 1);
    },
  },
  {
    name: "uses end-of-day fallback for a missing OUT",
    run: () => {
      const result = calculatePayrollFromLogs(
        [makeLog("emp-1", "IN", "2026-04-01T20:00:00")],
        { missingOutStrategy: "endOfDay" },
      );

      assert.equal(result.totalMinutes, 239);
      assert.equal(result.totalHours, 3.98);
      assert.equal(result.display, "3h 59m");
      assert.equal(result.shifts[0]?.note, "Auto-closed at end of day");
    },
  },
  {
    name: "skips a previous unmatched IN when a newer IN arrives",
    run: () => {
      const result = calculatePayrollFromLogs([
        makeLog("emp-1", "IN", "2026-04-01T08:00:00"),
        makeLog("emp-1", "IN", "2026-04-01T09:00:00"),
        makeLog("emp-1", "OUT", "2026-04-01T17:00:00"),
      ]);

      assert.equal(result.totalMinutes, 480);
      assert.equal(result.totalHours, 8);
      assert.equal(result.shifts.length, 1);
      assert.equal(result.shifts[0]?.in.getHours(), 9);
      assert.equal(result.shifts[0]?.in.getMinutes(), 0);
    },
  },
  {
    name: "supports multiple shifts in one day without rounding per shift",
    run: () => {
      const result = calculatePayrollFromLogs([
        makeLog("emp-1", "IN", "2026-04-01T08:00:00"),
        makeLog("emp-1", "OUT", "2026-04-01T12:15:00"),
        makeLog("emp-1", "IN", "2026-04-01T13:00:00"),
        makeLog("emp-1", "OUT", "2026-04-01T17:30:00"),
      ]);

      assert.equal(result.totalMinutes, 525);
      assert.equal(result.totalHours, 8.75);
      assert.equal(result.display, "8h 45m");
      assert.equal(result.shifts.length, 2);
    },
  },
  {
    name: "ignores orphan OUT logs and shifts shorter than one minute while keeping cross-day shifts",
    run: () => {
      const result = calculatePayrollFromLogs([
        makeLog("emp-1", "OUT", "2026-04-01T07:00:00"),
        makeLog("emp-1", "IN", "2026-04-01T23:30:00"),
        makeLog("emp-1", "OUT", "2026-04-02T02:15:00"),
        makeLog("emp-1", "IN", "2026-04-02T10:00:00"),
        makeLog("emp-1", "OUT", "2026-04-02T10:00:30"),
      ]);

      assert.equal(result.totalMinutes, 165);
      assert.equal(result.totalHours, 2.75);
      assert.equal(result.shifts.length, 1);
      assert.equal(result.display, "2h 45m");
    },
  },
  {
    name: "builds employee reports and clamps worked time to the requested range",
    run: () => {
      const reports = buildEmployeePayrollReports(
        [employee],
        [
          makeLog("emp-1", "IN", "2026-04-01T22:00:00"),
          makeLog("emp-1", "OUT", "2026-04-02T02:00:00"),
        ],
        {
          rangeStart: at("2026-04-02T00:00:00"),
          rangeEnd: at("2026-04-02T23:59:59.999"),
        },
      );

      assert.equal(reports.length, 1);
      assert.equal(reports[0]?.totalMinutes, 120);
      assert.equal(reports[0]?.totalHours, 2);
      assert.equal(reports[0]?.display, "2h 0m");
      assert.equal(reports[0]?.dailySummaries.length, 1);
      assert.equal(reports[0]?.dailySummaries[0]?.dateKey, "2026-04-02");
      assert.equal(reports[0]?.dailySummaries[0]?.display, "2h 0m");
      assert.equal(reports[0]?.dailySummaries[0]?.shifts.length, 1);
    },
  },
  {
    name: "groups multiple shifts into per-day summaries",
    run: () => {
      const reports = buildEmployeePayrollReports(
        [employee],
        [
          makeLog("emp-1", "IN", "2026-04-01T08:00:00"),
          makeLog("emp-1", "OUT", "2026-04-01T12:00:00"),
          makeLog("emp-1", "IN", "2026-04-01T13:00:00"),
          makeLog("emp-1", "OUT", "2026-04-01T17:00:00"),
          makeLog("emp-1", "IN", "2026-04-02T09:15:00"),
          makeLog("emp-1", "OUT", "2026-04-02T11:45:00"),
        ],
      );

      assert.equal(reports.length, 1);
      assert.equal(reports[0]?.dailySummaries.length, 2);
      assert.equal(reports[0]?.dailySummaries[0]?.dateKey, "2026-04-01");
      assert.equal(reports[0]?.dailySummaries[0]?.display, "8h 0m");
      assert.equal(reports[0]?.dailySummaries[0]?.totalHours, 8);
      assert.equal(reports[0]?.dailySummaries[0]?.shifts.length, 2);
      assert.equal(reports[0]?.dailySummaries[1]?.dateKey, "2026-04-02");
      assert.equal(reports[0]?.dailySummaries[1]?.display, "2h 30m");
      assert.equal(reports[0]?.dailySummaries[1]?.totalHours, 2.5);
      assert.equal(reports[0]?.timesheetRows.length, 3);
      assert.equal(reports[0]?.timesheetRows[0]?.date, "2026-04-01");
      assert.equal(reports[0]?.timesheetRows[0]?.clockIn, "08:00");
      assert.equal(reports[0]?.timesheetRows[0]?.clockOut, "12:00");
      assert.equal(reports[0]?.timesheetRows[0]?.durationMinutes, 240);
      assert.equal(reports[0]?.timesheetRows[2]?.durationDisplay, "2.50 h (2h 30m)");
    },
  },
  {
    name: "builds grouped payroll timesheet rows with employee and global totals",
    run: () => {
      const timesheet = buildPayrollTimesheet(
        [employee, secondEmployee],
        [
          makeLog("emp-2", "IN", "2026-04-04T19:30:00"),
          makeLog("emp-2", "OUT", "2026-04-04T19:35:00"),
          makeLog("emp-2", "IN", "2026-04-04T19:38:00"),
          makeLog("emp-2", "OUT", "2026-04-04T21:50:00"),
          makeLog("emp-1", "IN", "2026-04-03T09:00:00"),
          makeLog("emp-1", "OUT", "2026-04-03T17:00:00"),
        ],
      );

      assert.equal(timesheet.employeeGroups.length, 2);
      assert.equal(timesheet.rows.length, 3);
      assert.equal(timesheet.rows[0]?.employeeName, "Alex");
      assert.equal(timesheet.rows[1]?.employeeName, "Kim");
      assert.equal(timesheet.rows[1]?.durationMinutes, 5);
      assert.equal(timesheet.rows[2]?.durationMinutes, 132);
      assert.equal(timesheet.employeeGroups[1]?.display, "2h 17m");
      assert.equal(timesheet.employeeGroups[1]?.totalHours.toFixed(2), "2.28");
      assert.equal(timesheet.globalSummary.totalMinutes, 617);
      assert.equal(timesheet.globalSummary.display, "10h 17m");
      assert.equal(timesheet.globalSummary.totalHoursDecimal.toFixed(2), "10.28");
    },
  },
  {
    name: "builds deterministic demo seed data for reports",
    run: () => {
      const demoSeed = buildDemoStoreSeed(at("2026-04-06T12:00:00"));

      assert.equal(demoSeed.storeName, "Demo Payroll Store");
      assert.equal(demoSeed.pin, "1234");
      assert.deepEqual(demoSeed.employeeNames, ["Kim", "Alex", "Maria", "Noah"]);
      assert.ok(demoSeed.timelogs.length > 20);
      assert.equal(demoSeed.timelogs[0]?.type, "IN");
      assert.ok(demoSeed.timelogs.some((log) => log.employeeName === "Alex" && log.type === "IN"));
      assert.ok(demoSeed.timelogs.some((log) => log.employeeName === "Alex" && log.type === "OUT"));
      assert.equal(
        demoSeed.timelogs.filter((log) => log.employeeName === "Alex" && log.type === "IN").length,
        demoSeed.timelogs.filter((log) => log.employeeName === "Alex" && log.type === "OUT").length + 1,
      );
      assert.ok(
        demoSeed.timelogs.some(
          (log) => log.employeeName === "Noah" && log.timestamp.getHours() === 22,
        ),
      );
    },
  },
  {
    name: "handles a large dataset efficiently",
    run: () => {
      const employees: Employee[] = Array.from({ length: 200 }, (_, index) => ({
        id: `emp-${index}`,
        name: `Employee ${index}`,
        store_id: "store-1",
        created_at: at("2026-01-01T00:00:00"),
      }));

      const logs: Timelog[] = employees.flatMap((currentEmployee, index) => {
        const day = String((index % 20) + 1).padStart(2, "0");
        return [
          makeLog(currentEmployee.id, "IN", `2026-04-${day}T08:00:00`),
          makeLog(currentEmployee.id, "OUT", `2026-04-${day}T17:00:00`),
          makeLog(currentEmployee.id, "IN", `2026-04-${day}T18:00:00`),
          makeLog(currentEmployee.id, "OUT", `2026-04-${day}T20:30:00`),
        ];
      });

      const startedAt = performance.now();
      const reports = buildEmployeePayrollReports(employees, logs);
      const durationMs = performance.now() - startedAt;

      assert.equal(reports.length, 200);
      assert.equal(reports[0]?.totalMinutes, 690);
      assert.ok(durationMs < 1000, `Expected payroll calculation under 1000ms, received ${durationMs.toFixed(2)}ms`);
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
  throw new Error(`${failed} payroll test(s) failed`);
}

console.log(`Passed ${tests.length} payroll tests`);
