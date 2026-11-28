import { format } from "date-fns";
import { Pencil } from "lucide-react";

import { describeEdit } from "../corrections";
import type { TimesheetRow } from "../types";

// Native <details>: keyboard and screen-reader accessible without extra state, works on touch.
export function EditedBadge({ row }: { row: TimesheetRow }) {
  if (!row.edits?.length) {
    return null;
  }
  return (
    <details className="ml-1.5 inline-block align-middle text-xs font-semibold text-text-muted">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full border border-surfacestroke px-2 py-0.5 marker:hidden">
        <Pencil className="h-3 w-3" aria-hidden="true" />
        Edited
      </summary>
      <ul className="mt-1 space-y-1 font-normal">
        {row.edits.map((edit) => (
          <li key={edit.id}>
            <span className="font-semibold text-foreground">{describeEdit(edit, row)}</span>
            {` by ${edit.changed_by} on ${format(edit.created_at, "dd-MM-yyyy HH:mm")}: ${edit.reason}`}
          </li>
        ))}
      </ul>
    </details>
  );
}
