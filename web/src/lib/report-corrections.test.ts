import assert from "node:assert/strict";

import { attachCorrections, describeEdit, validateReason } from "../features/reports/corrections";
import type { EmployeeReport, TimesheetRow } from "../features/reports/types";
import type { Correction } from "../types";

function at(value: string): Date {
  return new Date(value);
}

const row: TimesheetRow = {
  employeeId: "e1",
  employeeName: "Kim",
  clockInLogId: "in-1",
  clockOutLogId: "out-1",
  date: "2026-04-22",
  clockIn: "09:00",
  clockOut: "17:00",
  durationMinutes: 480,
  durationDisplay: "8.00 h (8h 0m)",
  clockInAt: at("2026-04-22T09:00:00"),
  clockOutAt: at("2026-04-22T17:00:00"),
  shiftState: "closed",
};
const report = {
  employee: { id: "e1", name: "Kim", store_id: "s", created_at: at("2026-01-01T00:00:00"), status: "active" },
  name: "Kim",
  totalMinutes: 480,
  totalHours: 8,
  display: "8h",
  shifts: [],
  dailySummaries: [],
  timesheetRows: [row, { ...row, clockInLogId: "in-2", clockOutLogId: "out-2" }],
} as unknown as EmployeeReport;

const edit = (id: string, timelog_id: string, created: string, old: string | null, next: string): Correction => ({
  id,
  timelog_id,
  old_timestamp: old ? at(old) : null,
  new_timestamp: at(next),
  changed_by: "bob@example.com",
  reason: "Late scan",
  created_at: at(created),
});
const corrections = [
  edit("c2", "out-1", "2026-04-23T10:00:00Z", "2026-04-22T16:00:00", "2026-04-22T17:00:00"),
  edit("c1", "in-1", "2026-04-23T10:00:00Z", "2026-04-22T08:00:00", "2026-04-22T09:00:00"),
  edit("c0", "out-1", "2026-04-23T09:00:00Z", null, "2026-04-22T16:00:00"),
];

const tests = [
  {
    name: "validateReason enforces trimmed length bounds",
    run: () => {
      assert.ok(validateReason("  ab  "));
      assert.equal(validateReason("abc"), null);
      assert.equal(validateReason("x".repeat(500)), null);
      assert.ok(validateReason("x".repeat(501)));
    },
  },
  {
    name: "attachCorrections maps edits to rows by timelog id, oldest first, clock-in first on ties",
    run: () => {
      const [attached] = attachCorrections([report], corrections);
      assert.deepEqual(attached.timesheetRows[0].edits?.map((e) => e.id), ["c0", "c1", "c2"]);
      assert.equal(attached.timesheetRows[1].edits, undefined);
    },
  },
  {
    name: "describeEdit words clock-in changes, additions and clock-out changes",
    run: () => {
      assert.equal(describeEdit(corrections[1], row), "Clock-in 08:00 → 09:00");
      assert.equal(describeEdit(corrections[2], row), "Clock-out added 16:00");
      assert.equal(describeEdit(corrections[0], row), "Clock-out 16:00 → 17:00");
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
  throw new Error(`${failed} report correction test(s) failed`);
}

console.log(`Passed ${tests.length} report correction tests`);
