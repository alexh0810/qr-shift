---
phase: 03-product-rebrand
reviewed: 2026-04-10T14:26:10Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/components/PinGuard.tsx
  - src/components/InstallPrompt.tsx
  - src/components/manager/ManagerWorkspaceShell.tsx
  - src/components/manager/ManagerWorkspaceHeader.tsx
  - src/app/scan/[qr_token]/page.tsx
  - src/components/scan/ScanEmployeeCard.tsx
  - src/components/scan/ScanActionPanel.tsx
  - src/app/dashboard/[qr_token]/page.tsx
  - src/app/reports/[qr_token]/page.tsx
  - src/components/landing/HeroPreview.tsx
  - src/features/reports/components/AllEmployeesTimesheetTable.tsx
  - src/features/reports/components/EmployeeReportDetail.tsx
  - src/features/reports/components/EmployeeSelect.tsx
  - src/features/reports/components/ReportSummaryCards.tsx
  - src/app/admin/create-store/page.tsx
  - public/manifest.json
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-10T14:26:10Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the Phase 3 rebrand changes across the manager shell, scan flow, reports UI, admin setup page, and manifest metadata. The UI work is broadly consistent with the design contract, but two actionable regressions remain: the new PIN gate now exposes the manager PIN directly in the unlock UI, and the dashboard can get stuck on the loading spinner if the Firestore realtime listener fails before the first snapshot arrives.

## Critical Issues

### CR-01: Manager PIN is rendered on the unlock screen

**File:** `src/components/PinGuard.tsx:103-109`
**Issue:** The branded unlock screen displays `store?.pin` in plain text as a "Demo PIN". That removes the only secret protecting the manager workspace on shared devices and turns the PIN check into an immediate bypass for anyone who can open the route.
**Fix:**
```tsx
<div className="rounded-[24px] border border-dashed border-border-strong bg-background px-4 py-4 text-center">
  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
    Manager PIN
  </p>
  <p className="mt-2 text-sm font-medium text-text-muted">
    Ask the manager for the PIN to unlock this workspace.
  </p>
</div>
```

## Warnings

### WR-01: Dashboard never leaves loading state when realtime subscription fails

**File:** `src/app/dashboard/[qr_token]/page.tsx:78-80`
**Issue:** The `onSnapshot` error callback sets `error`, but it does not call `setLoading(false)`. If Firestore rejects the listener before delivering an initial snapshot, the page stays on the fullscreen spinner and never renders the inline error state.
**Fix:**
```tsx
unsubscribeTimelogs = onSnapshot(
  q,
  (snapshot) => {
    // existing success path
  },
  () => {
    setError("Real-time listener failed to connect.");
    setLoading(false);
  },
);
```

---

_Reviewed: 2026-04-10T14:26:10Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
