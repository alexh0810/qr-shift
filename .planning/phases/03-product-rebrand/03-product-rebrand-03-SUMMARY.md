---
phase: 03-product-rebrand
plan: "03"
subsystem: ui
tags: [nextjs, react, tailwind, dashboard, reports, landing-preview, manager-workspace]
requires:
  - phase: 01-brand-foundation
    provides: QRShift token, typography, and shared manager workspace primitives
  - phase: 02-landing-page
    provides: public product story and the landing hero that now needs real UI reuse
provides:
  - unified dashboard and reports routes on one shared manager workspace language
  - payroll-readable report tables and employee views with explicit local-edit messaging
  - landing hero preview composed from shipped scan, manager, and report UI primitives
affects: [dashboard, reports, landing-page, manager-workspace, responsive-ui]
tech-stack:
  added: []
  patterns: [shared manager status panel reuse, workspace stat-card composition, framed real-product landing preview]
key-files:
  created:
    - src/components/manager/ShiftStatusPanel.tsx
    - src/components/landing/ProductPreviewFrame.tsx
    - src/features/reports/useIsPhoneWidth.ts
  modified:
    - src/app/dashboard/[qr_token]/page.tsx
    - src/app/reports/[qr_token]/page.tsx
    - src/components/landing/HeroPreview.tsx
    - src/features/reports/components/AllEmployeesTimesheetTable.tsx
    - src/features/reports/components/EmployeeReportDetail.tsx
    - src/features/reports/components/EmployeeSelect.tsx
    - src/features/reports/components/ReportSummaryCards.tsx
key-decisions:
  - "Made dashboard the dominant preview and workspace anchor, while reports remained the export companion inside the same shell language."
  - "Used shared shipped primitives and one extracted manager status panel for landing reuse instead of keeping route-local preview markup."
patterns-established:
  - "Manager workspace routes should compose ManagerWorkspaceHeader, WorkspacePanel, WorkspaceStatCard, and shared status panels before adding route-local markup."
  - "Landing product previews should only frame real shipped UI and static sample data, not invent alternate marketing-only interface blocks."
requirements-completed: [BRAND-02, UX-01, UX-02]
duration: 11 min
completed: 2026-04-15
---

# Phase 03 Plan 03: Product Rebrand Summary

**Shared manager workspace dashboard/reports routes plus a landing hero rebuilt from the shipped scan, monitor, and export UI**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-15T15:28:00+03:00
- **Completed:** 2026-04-15T15:39:08+03:00
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Reworked `/dashboard/[qr_token]` and `/reports/[qr_token]` so they read as one connected QRShift manager workspace built from the shared header, panel, stat-card, and responsive table language.
- Preserved the existing manager/report behavior boundaries, including realtime dashboard updates, PIN/localStorage gating, CSV export, date filtering, employee filtering, inline row edits, and open-shift report handling.
- Replaced the landing hero’s conceptual mock panels with a framed composition of shipped product UI: manager header and cards, scan action panel, and report summary surface.

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor dashboard and reports onto the shared manager surface system** - `6aa7f85` (feat)
2. **Task 2: Rebuild the landing hero preview from actual product components** - `6bc7e1f` (feat)

Additional verification fix:

- `62f24cd` - track the responsive reports hook required by the committed Task 1 UI

## Files Created/Modified

- `src/app/dashboard/[qr_token]/page.tsx` - moved the live board onto the shared manager header/stat/panel system while keeping `getStoreByQrToken`, `getEmployeesByStoreId`, `onSnapshot`, and device lock behavior intact.
- `src/app/reports/[qr_token]/page.tsx` - aligned reports to the same workspace shell, restored the dynamic open-shift report calculation behavior, and kept CSV export plus local edit messaging explicit.
- `src/components/manager/ShiftStatusPanel.tsx` - extracted reusable manager shift-status panel UI so the dashboard and landing preview can share the same shipped surface.
- `src/components/landing/HeroPreview.tsx` - rebuilt the landing hero from real shipped QRShift components instead of conceptual marketing-only mock panels.
- `src/components/landing/ProductPreviewFrame.tsx` - added an outer framing wrapper for cropping/composition without inventing product internals.
- `src/features/reports/components/AllEmployeesTimesheetTable.tsx` - kept payroll tables readable with shared header treatment, mobile cards, and desktop overflow behavior.
- `src/features/reports/components/EmployeeReportDetail.tsx` - preserved row editing while keeping local-only export scope explicit in the single-employee detail view.
- `src/features/reports/components/EmployeeSelect.tsx` - aligned employee filtering to the shared workspace panel contract with touch-safe controls.
- `src/features/reports/components/ReportSummaryCards.tsx` - moved report totals onto the shared workspace stat-card language.
- `src/features/reports/useIsPhoneWidth.ts` - tracked the phone-width hook used by the responsive report table/detail layouts.

## Decisions Made

- Kept the manager route unification at the component layer, not the routing layer, so the current `dashboard` and `reports` data flows stayed intact while the product language converged.
- Treated static preview data as acceptable only when rendered through shipped product components and shared primitives, keeping the public hero honest about what the app actually looks like.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extracted a shared shift-status panel for real landing preview reuse**
- **Found during:** Task 1 and Task 2
- **Issue:** The dashboard still relied on route-local employee status markup, which would have forced the landing hero back into duplicated mock-panel internals.
- **Fix:** Added `src/components/manager/ShiftStatusPanel.tsx` and routed both the dashboard and the landing preview through that shared shipped manager UI.
- **Files modified:** `src/components/manager/ShiftStatusPanel.tsx`, `src/app/dashboard/[qr_token]/page.tsx`, `src/components/landing/HeroPreview.tsx`
- **Verification:** Targeted `eslint`, task-specific `rg` checks, and full `npm run lint && npm test && npm run build`
- **Committed in:** `6aa7f85` and `6bc7e1f`

**2. [Rule 3 - Blocking] Tracked the responsive reports hook that Task 1 depended on**
- **Found during:** Post-verification worktree audit
- **Issue:** `AllEmployeesTimesheetTable` and `EmployeeReportDetail` depended on `src/features/reports/useIsPhoneWidth.ts`, but the file existed only as an untracked local worktree artifact.
- **Fix:** Added the hook to git so the committed plan does not depend on an untracked file in the main tree.
- **Files modified:** `src/features/reports/useIsPhoneWidth.ts`
- **Verification:** Full `npm run lint && npm test && npm run build` had already passed with this file present; the fix made that dependency durable in git.
- **Committed in:** `62f24cd`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both fixes were required to satisfy the “real shipped UI” preview contract and to keep the committed result portable beyond the current live worktree.

## Issues Encountered

- The current main worktree already contained uncommitted Phase 3 edits in planning files, `src/app/page.tsx`, and report helper modules. They were left untouched and excluded from the `03-03` commits.
- An older untracked draft of this summary existed in the tree. It was replaced with the actual sequential execution record for this run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dashboard, reports, and the public landing preview now share one QRShift product language, so subsequent polish can build on shipped primitives instead of route-specific mockups.
- The live tree still contains unrelated uncommitted Phase 3 edits in planning files and report helper/test files; they remain outside this plan and should be reconciled separately.

## Self-Check: PASSED

- Found `.planning/phases/03-product-rebrand/03-product-rebrand-03-SUMMARY.md`
- Found commit `6aa7f85`
- Found commit `6bc7e1f`
- Found commit `62f24cd`

---
*Phase: 03-product-rebrand*
*Completed: 2026-04-15*
