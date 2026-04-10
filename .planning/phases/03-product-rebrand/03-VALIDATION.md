---
phase: 3
slug: product-rebrand
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Next.js lint + TypeScript compiler + existing Node payroll test suite + plan-specific grep assertions |
| **Config file** | `package.json`, `tsconfig.json`, `.github/workflows/ci.yml` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run lint && npm test && npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-local `<automated>` command from the active plan
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Run `npm run lint && npm test && npm run build`
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | BRAND-02 | T-03-02 | Shared manager workspace primitives exist only for dashboard/reports and establish the deep redesign foundation required by D-04 | static | `rg -n "export function ManagerWorkspaceShell|export function ManagerWorkspaceHeader|max-w-5xl|Dashboard|Reports|primaryAction|statusBadge" src/components/manager` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | UX-01 | T-03-01 | Manager boundary surfaces stay demo-scoped while preserving unlock/install behavior and adding route smoke checks | regression | `rg -n "getStoreByQrToken|localStorage\\.setItem|beforeinstallprompt|/scan/|/dashboard/|/reports/|/admin/create-store|reinstall the PWA" src/components/PinGuard.tsx src/components/InstallPrompt.tsx .planning/phases/03-product-rebrand/03-SMOKE-CHECKLIST.md` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | UX-01 | T-03-05 | Scan refactor preserves employee load/status/write behavior while extracting branded components | regression | `rg -n "ScanEmployeeCard|ScanActionPanel|getStoreByQrToken|getEmployeesByStoreId|getLatestTimelog|addTimelog|last_scan_token" 'src/app/scan/[qr_token]/page.tsx' src/components/scan` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | UX-02 | T-03-04 | Scan stays standalone, mobile-safe, and free of manager navigation | static | `rg -n "max-w-md|Clocked|No employees found for this store\\." 'src/app/scan/[qr_token]/page.tsx' && ! rg -n "bg-error.*CheckCircle|/dashboard/|/reports/" 'src/app/scan/[qr_token]/page.tsx'` | ✅ | ⬜ pending |
| 3-03-01 | 03 | 2 | BRAND-02 | T-03-07 | Dashboard becomes the workspace anchor without weakening existing lock/realtime behavior | regression | `rg -n "ManagerWorkspaceShell|ManagerWorkspaceHeader|onSnapshot|InstallPrompt|localStorage\\.removeItem|On Shift|Off Shift|Reports" 'src/app/dashboard/[qr_token]/page.tsx'` | ✅ | ⬜ pending |
| 3-03-02 | 03 | 2 | UX-01 | T-03-08 | Reports and landing preview inherit the redesigned workspace while keeping report/export logic intact | integration | `rg -n "buildReportData|buildReportsCsv|ManagerWorkspaceShell|ManagerWorkspaceHeader" 'src/app/reports/[qr_token]/page.tsx' && rg -n "export function AllEmployeesTimesheetTable|export function EmployeeReportDetail|export function EmployeeSelect|export function ReportSummaryCards" src/features/reports/components && rg -n "Scan -> Monitor -> Export|Live Board|Export" src/components/landing/HeroPreview.tsx` | ✅ | ⬜ pending |
| 3-04-01 | 04 | 1 | UX-01 | T-03-10 | Admin create-store keeps all setup/demo actions while moving failures inline | regression | `rg -n "nanoid\\(10\\)|createStoreAndEmployees|createDemoStoreWithTimelogs|QRCodeSVG|downloadQR|Failed to create store|Failed to create demo store" src/app/admin/create-store/page.tsx && ! rg -n "alert\\(" src/app/admin/create-store/page.tsx` | ✅ | ⬜ pending |
| 3-04-02 | 04 | 1 | BRAND-02 | T-03-12 | Installed-app metadata matches QRShift and removes the stale Shiftly identity | static | `rg -n "\"name\": \"QRShift\"|\"short_name\": \"QRShift\"|\"theme_color\"|\"description\"|/icons/icon-192.png|/icons/icon-512.png" public/manifest.json && ! rg -n "Shiftly" public/manifest.json` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Create `.planning/phases/03-product-rebrand/03-SMOKE-CHECKLIST.md` during Plan `03-01` execution so manual route checks have a concrete artifact.
- [ ] Add scan-specific UI components under `src/components/scan/` during Plan `03-02` execution before route grep assertions can pass.
- [ ] Preserve current test infrastructure; this phase relies on existing lint/build/test commands plus plan-local assertions instead of a new UI test harness.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Phase 3 reads as a deep redesign rather than a paint-over of legacy screens | BRAND-02 | Depth and cohesion require human comparison across multiple routes | Review `/dashboard/[qr_token]` and `/reports/[qr_token]` on desktop and mobile, confirm shared shell, headers, navigation, cards, and table language are materially restructured rather than recolored |
| Manager workspace feels unified while scan and admin remain intentionally separate | BRAND-02, UX-02 | Surface-boundary clarity is a product judgment, not a pure code assertion | Open `/scan/[qr_token]`, `/dashboard/[qr_token]`, `/reports/[qr_token]`, and `/admin/create-store`; confirm only dashboard/reports share workspace chrome and scan/admin each stay distinct |
| Core demo flows still work after the redesign | UX-01 | Requires live interaction across multiple routes and device widths | Use the Phase 3 smoke checklist to test employee clock in/out, manager unlock/lock, report filtering/export, and admin store/demo creation on phone and desktop widths |
| Installed PWA branding refreshes correctly | BRAND-02 | Browser and OS-level install caching cannot be fully asserted from CLI alone | After manifest changes, open the installed app or add-to-home-screen flow; verify the name shows `QRShift`, and if the old name persists, reinstall the PWA and confirm the updated identity appears |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or existing infrastructure
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-10
