import {
  calculateDurationMinutes,
  formatPayrollDuration,
  formatTime,
  getLocalDateKey,
} from "../../lib/time-calculation";
import { Timelog } from "../../types";
import { rebuildEmployeeReport } from "./data-processing";
import { EmployeeReport, ReportDraft, TimesheetRow } from "./types";

const REPORT_DRAFTS_STORAGE_PREFIX = "qrshift-report-drafts";

function sortEmployeeLogs(logs: Timelog[], employeeId: string) {
  return logs
    .filter((log) => log.employee_id === employeeId)
    .sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
}

function isSameLocalDay(left: Date, right: Date) {
  return getLocalDateKey(left) === getLocalDateKey(right);
}

export function getReportDraftStorageKey(qrToken: string) {
  return `${REPORT_DRAFTS_STORAGE_PREFIX}:${qrToken}`;
}

export function readStoredReportDrafts(qrToken: string): ReportDraft[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(getReportDraftStorageKey(qrToken));
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is ReportDraft => {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      const candidate = entry as Record<string, unknown>;
      return (
        typeof candidate.employeeId === "string" &&
        typeof candidate.clockInLogId === "string" &&
        typeof candidate.draftClockOutAt === "string" &&
        typeof candidate.savedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

export function writeStoredReportDrafts(qrToken: string, drafts: ReportDraft[]) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getReportDraftStorageKey(qrToken);
  if (drafts.length === 0) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(drafts));
}

export function upsertReportDraft(
  drafts: ReportDraft[],
  nextDraft: ReportDraft,
) {
  const remainingDrafts = drafts.filter(
    (draft) =>
      !(draft.employeeId === nextDraft.employeeId && draft.clockInLogId === nextDraft.clockInLogId),
  );

  return [...remainingDrafts, nextDraft];
}

export function removeReportDraft(
  drafts: ReportDraft[],
  employeeId: string,
  clockInLogId: string,
) {
  return drafts.filter(
    (draft) => !(draft.employeeId === employeeId && draft.clockInLogId === clockInLogId),
  );
}

export function shouldUseLocalDraftForRow(row: TimesheetRow, now: Date) {
  return row.clockOutLogId === null && isSameLocalDay(row.clockInAt, now);
}

export function pruneReportDrafts(
  drafts: ReportDraft[],
  allLogs: Timelog[],
  now: Date,
) {
  return drafts.filter((draft) => {
    const employeeLogs = sortEmployeeLogs(allLogs, draft.employeeId);
    const clockInIndex = employeeLogs.findIndex((log) => log.id === draft.clockInLogId);
    if (clockInIndex === -1) {
      return false;
    }

    const clockInLog = employeeLogs[clockInIndex];
    if (clockInLog.type !== "IN") {
      return false;
    }

    if (!isSameLocalDay(clockInLog.timestamp, now)) {
      return false;
    }

    const draftClockOutAt = new Date(draft.draftClockOutAt);
    if (
      Number.isNaN(draftClockOutAt.getTime()) ||
      draftClockOutAt <= clockInLog.timestamp ||
      !isSameLocalDay(clockInLog.timestamp, draftClockOutAt)
    ) {
      return false;
    }

    for (let index = clockInIndex + 1; index < employeeLogs.length; index += 1) {
      const nextLog = employeeLogs[index];
      if (nextLog.type === "IN" || nextLog.type === "OUT") {
        return false;
      }
    }

    return true;
  });
}

export function applyReportDrafts(
  reports: EmployeeReport[],
  drafts: ReportDraft[],
) {
  const draftByKey = new Map(
    drafts.map((draft) => [`${draft.employeeId}:${draft.clockInLogId}`, draft] as const),
  );

  return reports.map((report) => {
    const nextRows = report.timesheetRows.map((row) => {
      const draft = draftByKey.get(`${row.employeeId}:${row.clockInLogId}`);
      if (!draft || row.shiftState !== "ongoing") {
        return row;
      }

      const draftClockOutAt = new Date(draft.draftClockOutAt);
      if (Number.isNaN(draftClockOutAt.getTime()) || draftClockOutAt <= row.clockInAt) {
        return row;
      }

      const durationMinutes = Math.max(
        0,
        Math.round(calculateDurationMinutes(row.clockInAt, draftClockOutAt)),
      );

      return {
        ...row,
        clockOut: formatTime(draftClockOutAt),
        clockOutAt: draftClockOutAt,
        durationMinutes,
        durationDisplay: formatPayrollDuration(durationMinutes),
        shiftState: "managerOverride" as const,
        note: "Ongoing",
      };
    });

    return rebuildEmployeeReport(report.employee, nextRows);
  });
}
