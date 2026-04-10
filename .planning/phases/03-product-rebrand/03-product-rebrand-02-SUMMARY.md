---
phase: 03-product-rebrand
plan: "02"
subsystem: ui
tags: [nextjs, react, tailwind, scan-flow, branding]
requires:
  - phase: 01-brand-foundation
    provides: QRShift brand tokens, typography, and surface rules
  - phase: 02-landing-page
    provides: public-facing QRShift brand voice and product framing
provides:
  - branded standalone scan route components for employee selection and clock actions
  - phase 3 copy and feedback states for loading, empty, error, and success scan flows
affects: [03-03-PLAN, 03-04-PLAN, scan-route]
tech-stack:
  added: []
  patterns: [standalone branded route components, inline route-scoped feedback]
key-files:
  created:
    - src/components/scan/ScanEmployeeCard.tsx
    - src/components/scan/ScanActionPanel.tsx
  modified:
    - src/app/scan/[qr_token]/page.tsx
key-decisions:
  - "Kept the scan route separate from manager workspace chrome and navigation."
  - "Preserved existing Firestore helper calls and IN/OUT decision logic while replacing the UI shell."
patterns-established:
  - "Scan routes can use dedicated branded primitives without sharing manager workspace components."
  - "Route-level scan feedback should stay inline and task-focused instead of relying on browser alerts or destructive success styling."
requirements-completed: [BRAND-02, UX-01, UX-02]
duration: 10min
completed: 2026-04-10
---

# Phase 03 Plan 02: Scan Surface Summary

**Standalone QR scan flow rebranded with dedicated employee cards, action panel feedback, and mobile-first QRShift state treatments**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-10T13:59:00Z
- **Completed:** 2026-04-10T14:09:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extracted the scan route into reusable `ScanEmployeeCard` and `ScanActionPanel` components.
- Preserved `getStoreByQrToken`, `getEmployeesByStoreId`, `getLatestTimelog`, `addTimelog`, `last_scan_token`, and the existing `IN`/`OUT` flow logic.
- Updated scan loading, empty, error, and success treatments to match the Phase 3 QRShift UI contract while staying standalone from manager pages.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract standalone scan UI primitives and refactor the route around them** - `0c38d97` (feat)
2. **Task 2: Apply Phase 3 copy and state treatments to scan loading, empty, error, and success flows** - `65ef224` (feat)

## Files Created/Modified
- `src/components/scan/ScanEmployeeCard.tsx` - Employee selection card with initials, status chip, and large tap target.
- `src/components/scan/ScanActionPanel.tsx` - Selected-employee action surface with current status, CTA, inline error, and success acknowledgement.
- `src/app/scan/[qr_token]/page.tsx` - Route orchestration updated to use branded scan primitives and route-local state messaging.

## Decisions Made

- Kept the scan route visually branded but isolated from dashboard and reports navigation to satisfy D-08.
- Moved status and action presentation into dedicated scan components while keeping all attendance read/write behavior in the route.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx tsc --noEmit` is currently blocked by a pre-existing unrelated type error in `src/components/manager/ManagerWorkspaceHeader.tsx:32`. The scan-route changes verified via the plan grep checks and `npm test`.

## Known Stubs

- `src/app/scan/[qr_token]/page.tsx:103` - Existing `TODO` for PIN verification remains in place and was not expanded because this plan was limited to scan-surface presentation, not attendance authorization changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The scan route now matches the Phase 3 brand direction and remains behaviorally compatible with the existing QR clock flow.
- Dashboard and reports can reuse the same visual clarity standard without pulling employee scan into the manager workspace.

## Self-Check

PASSED

- Found `.planning/phases/03-product-rebrand/03-product-rebrand-02-SUMMARY.md`
- Found commit `0c38d97`
- Found commit `65ef224`

---
*Phase: 03-product-rebrand*
*Completed: 2026-04-10*
