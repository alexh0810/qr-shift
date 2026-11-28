import { format } from "date-fns";

import type { Correction } from "../../types";
import type { EmployeeReport, TimesheetRow } from "./types";

export const REASON_MIN = 3;
export const REASON_MAX = 500;

export function validateReason(raw: string): string | null {
  const reason = raw.trim();
  if (reason.length < REASON_MIN) {
    return "Add a reason of at least 3 characters.";
  }
  if (reason.length > REASON_MAX) {
    return "Reason must be 500 characters or fewer.";
  }
  return null;
}

export function attachCorrections(groups: EmployeeReport[], corrections: Correction[]): EmployeeReport[] {
  if (corrections.length === 0) {
    return groups;
  }
  const byTimelog = new Map<string, Correction[]>();
  for (const correction of corrections) {
    byTimelog.set(correction.timelog_id, [...(byTimelog.get(correction.timelog_id) ?? []), correction]);
  }
  return groups.map((group) => ({
    ...group,
    timesheetRows: group.timesheetRows.map((row) => {
      // Array.sort is stable: on equal created_at (one save edits both logs) the clock-in entry stays first.
      const edits = [
        ...(byTimelog.get(row.clockInLogId) ?? []),
        ...(row.clockOutLogId ? (byTimelog.get(row.clockOutLogId) ?? []) : []),
      ].sort((left, right) => left.created_at.getTime() - right.created_at.getTime());
      return edits.length > 0 ? { ...row, edits } : row;
    }),
  }));
}

export function describeEdit(edit: Correction, row: TimesheetRow): string {
  const label = edit.timelog_id === row.clockInLogId ? "Clock-in" : "Clock-out";
  const next = format(edit.new_timestamp, "HH:mm");
  return edit.old_timestamp ? `${label} ${format(edit.old_timestamp, "HH:mm")} → ${next}` : `${label} added ${next}`;
}
