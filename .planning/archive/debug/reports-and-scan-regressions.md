---
status: investigating
trigger: "Investigate and fix report editing and scan regressions."
created: 2026-04-25T00:00:00+03:00
updated: 2026-04-25T00:36:00+03:00
---

## Current Focus

hypothesis: report persistence regression is still a missing UI-to-persistence wiring issue; the scan API regression itself is fixed in the current worktree, and the remaining manual-store 400 was caused by selecting an employee whose latest server-side log had already changed to `IN`
test: validate a different manual-store employee with `latest_log: null` to confirm the route accepts a valid `IN` transition there too
expecting: a successful POST for another manual-store employee will confirm there is no remaining generalized scan bug in the current code
next_action: submit a valid `IN` action for a manual-store employee whose refreshed roster still shows `OUT`

## Symptoms

expected: Managers can freely type time values in reports, refresh keeps corrected shifts, and scan clock actions succeed for valid IN/OUT transitions.
actual: Report hour editing is awkward with native time input, refresh drops report edits, and POST /api/stores/[qr_token]/clock returns 400 on valid actions in demo and manual stores.
errors: Scan POST returns 400 with generic save failure. Terminal confirms this happens on both Bupe7Tsivn3du30V and Vyy3Uo-Pa9RLT9Fa. Report refresh reloads server snapshot and loses local edits.
reproduction: 1) Open /reports and edit clock-out hour on a row. 2) Refresh report data. 3) Open /scan/<token> and submit valid clock action. 4) Observe 400.
started: Regressions appeared after recent changes.

## Eliminated

- hypothesis: report persistence is broken because no correction route exists on the server
  evidence: A code search found both src/app/api/manager/[qr_token]/reports/correction/route.ts and saveReportCorrectionServer in src/lib/server-db.ts.
  timestamp: 2026-04-25T00:16:30+03:00

- hypothesis: the current scan POST failure is caused by a permanent route/module crash in `/api/stores/[qr_token]/clock`
  evidence: After clearing `.next` and restarting `next dev`, a valid demo-store POST returned 200 with a saved clock action.
  timestamp: 2026-04-25T00:32:30+03:00

## Evidence

- timestamp: 2026-04-25T00:03:00+03:00
  checked: .planning/debug/knowledge-base.md
  found: No knowledge base file exists yet for prior resolved debug matches.
  implication: No known-pattern shortcut is available; investigation should proceed from source and runtime evidence.

- timestamp: 2026-04-25T00:04:00+03:00
  checked: /Users/alex/.codex/get-shit-done/references/common-bug-patterns.md
  found: Symptom mapping suggests State Management (multiple sources of truth) for report refresh loss and Data Shape / API Contract for the scan POST 400.
  implication: Prioritize verifying where report edits live and whether the clock route rejects a changed payload or persisted state shape.

- timestamp: 2026-04-25T00:04:30+03:00
  checked: codebase search for report/clock paths
  found: Report editing is centered in src/app/reports/[qr_token]/page.tsx and src/features/reports/components/AllEmployeesTimesheetTable.tsx; scan POST is issued by src/lib/client-api.ts to src/app/api/stores/[qr_token]/clock/route.ts.
  implication: The likely failure surface is narrow enough for direct full-file inspection and targeted runtime repro.

- timestamp: 2026-04-25T00:08:00+03:00
  checked: src/features/reports/components/AllEmployeesTimesheetTable.tsx
  found: Both mobile and desktop timesheet editors still render native `<input type="time">` controls for clock-in and clock-out.
  implication: The awkward hour/minute editing is a direct UI regression and will require replacing the native time control with a freer text-based entry experience.

- timestamp: 2026-04-25T00:08:30+03:00
  checked: src/lib/client-api.ts and src/lib/server-db.ts
  found: The client already has `saveReportCorrection`, and the server clock path validates requested transitions inside `createClockAction` before writing a new timelog in a transaction.
  implication: Report persistence may already have an API path that is not fully wired into report truth, while the scan failure is likely happening inside transaction read/write or precondition checks rather than in the fetch client.

- timestamp: 2026-04-25T00:12:30+03:00
  checked: src/app/reports/[qr_token]/page.tsx
  found: `updateTimesheetRow` only updates `reportData` state locally; the page imports `getReportsSnapshot` and `logoutManager` but does not import or call `saveReportCorrection`.
  implication: Refresh loss is expected because report edits never persist beyond the in-memory derived report view.

- timestamp: 2026-04-25T00:13:00+03:00
  checked: src/app/api/manager/[qr_token]/reports/correction/route.ts
  found: No correction route file exists at the expected path even though the client defines `saveReportCorrection`.
  implication: The persistence feature is incomplete end-to-end; correcting report rows currently has no server endpoint to update timelog truth.

- timestamp: 2026-04-25T00:16:00+03:00
  checked: codebase search for correction flow
  found: The codebase does contain `src/app/api/manager/[qr_token]/reports/correction/route.ts` and `saveReportCorrectionServer` in `src/lib/server-db.ts`.
  implication: The previous missing-route hypothesis was wrong; the remaining report bug is more specifically that the page never invokes the persistence flow during edits.

- timestamp: 2026-04-25T00:20:30+03:00
  checked: git diff for report and server-db files
  found: The current worktree already removes `where(...).orderBy("timestamp").limit(1)` from latest-timelog lookups and adds the report correction API/server implementation, but the reports page still does not call `saveReportCorrection` and the timesheet inputs remain native `type="time"`.
  implication: The scan regression was probably introduced by the old indexed query shape and may already be fixed locally; the remaining code change still needed is in the reports UI/persistence wiring unless runtime testing disproves that.

- timestamp: 2026-04-25T00:24:30+03:00
  checked: live `next dev` requests to /api/stores/[qr_token]/employees and /api/stores/[qr_token]/clock for Bupe7Tsivn3du30V and Vyy3Uo-Pa9RLT9Fa
  found: Employee roster requests succeed with 200 for both stores, but valid clock POSTs fail with HTTP 500 and `TypeError: __webpack_require__.a is not a function` during route module loading.
  implication: The current scan breakage is a server bundle/runtime import issue specific to the clock route, not a transition validation failure returned from `createClockAction`.

- timestamp: 2026-04-25T00:28:30+03:00
  checked: compiled `.next/server/app/api/stores/[qr_token]/*/route.js` bundles
  found: The working employees route and failing clock route both emit the same async `__webpack_require__.a(...)` loader pattern and both pull in `src/lib/server-db.ts`.
  implication: The immediate failure is not explained by a simple unique import in `server-db.ts`; a clean rebuild is the next discriminating test before changing code.

- timestamp: 2026-04-25T00:32:00+03:00
  checked: fresh `next dev` run after deleting `.next`
  found: POST `/api/stores/Bupe7Tsivn3du30V/clock` succeeded with 200 and persisted an `IN` action; POST `/api/stores/Vyy3Uo-Pa9RLT9Fa/clock` now returns a handled 400 with `This shift status changed. Go back and try again.`
  implication: The query change in `server-db.ts` resolves the broad scan regression, but there is still a narrower state mismatch to explain for the manual store token.

- timestamp: 2026-04-25T00:35:30+03:00
  checked: refreshed GET `/api/stores/Vyy3Uo-Pa9RLT9Fa/employees`
  found: The previously selected manual-store employee `6VuVhWB97QyxMcDi7jzJ` (Hannah) now has latest log `IN` at `2026-04-25T11:53:56.858Z`, so the attempted `IN` transition is invalid against current server truth.
  implication: The manual-store 400 is consistent with stale or changed roster state for that employee rather than a failing clock write path.

## Resolution

root_cause:
fix:
verification:
files_changed: []
