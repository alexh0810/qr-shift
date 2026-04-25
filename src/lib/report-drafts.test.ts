import assert from "node:assert/strict";

import { applyReportDrafts, pruneReportDrafts, shouldUseLocalDraftForRow } from "../features/reports/drafts";
import type { EmployeeReport, ReportDraft } from "../features/reports/types";
import type { Timelog } from "../types";

type TestCase = {
  name: string;
  run: () => void;
};

function at(value: string): Date {
  return new Date(value);
}

const ongoingReport: EmployeeReport = {
  employee: {
    id: "emp-1",
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
      employeeId: "emp-1",
      employeeName: "Alex",
      clockInLogId: "log-in-1",
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

function makeLog(id: string, employeeId: string, type: "IN" | "OUT", timestamp: string): Timelog {
  return {
    id,
    employee_id: employeeId,
    store_id: "store-1",
    type,
    timestamp: at(timestamp),
  };
}

const activeDraft: ReportDraft = {
  employeeId: "emp-1",
  clockInLogId: "log-in-1",
  draftClockOutAt: "2026-04-25T17:00:00.000Z",
  savedAt: "2026-04-25T15:30:00.000Z",
};

const tests: TestCase[] = [
  {
    name: "applies local report drafts to same-day ongoing rows",
    run: () => {
      const nextReports = applyReportDrafts([ongoingReport], [activeDraft]);
      const row = nextReports[0]?.timesheetRows[0];

      assert.equal(row?.clockOut, "20:00");
      assert.equal(row?.durationMinutes, 480);
      assert.equal(row?.durationDisplay, "8.00 h (8h 0m)");
      assert.equal(row?.shiftState, "managerOverride");
      assert.equal(nextReports[0]?.totalMinutes, 480);
    },
  },
  {
    name: "keeps a same-day draft while the shift is still the latest open log",
    run: () => {
      const nextDrafts = pruneReportDrafts(
        [activeDraft],
        [makeLog("log-in-1", "emp-1", "IN", "2026-04-25T12:00:00.000Z")],
        at("2026-04-25T16:00:00.000Z"),
      );

      assert.equal(nextDrafts.length, 1);
    },
  },
  {
    name: "removes a draft once a real clock-out exists for that shift",
    run: () => {
      const nextDrafts = pruneReportDrafts(
        [activeDraft],
        [
          makeLog("log-in-1", "emp-1", "IN", "2026-04-25T12:00:00.000Z"),
          makeLog("log-out-1", "emp-1", "OUT", "2026-04-25T19:42:00.000Z"),
        ],
        at("2026-04-25T19:45:00.000Z"),
      );

      assert.equal(nextDrafts.length, 0);
    },
  },
  {
    name: "removes a draft after the day rolls over",
    run: () => {
      const nextDrafts = pruneReportDrafts(
        [activeDraft],
        [makeLog("log-in-1", "emp-1", "IN", "2026-04-25T12:00:00.000Z")],
        at("2026-04-26T08:00:00.000Z"),
      );

      assert.equal(nextDrafts.length, 0);
    },
  },
  {
    name: "treats same-day open rows as local-draft candidates",
    run: () => {
      assert.equal(
        shouldUseLocalDraftForRow(ongoingReport.timesheetRows[0]!, at("2026-04-25T16:00:00.000Z")),
        true,
      );
      assert.equal(
        shouldUseLocalDraftForRow(ongoingReport.timesheetRows[0]!, at("2026-04-26T08:00:00.000Z")),
        false,
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
  throw new Error(`${failed} report draft test(s) failed`);
}

console.log(`Passed ${tests.length} report draft tests`);
