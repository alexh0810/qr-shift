---
phase: 2
slug: landing-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Next.js lint + TypeScript compiler + existing Node payroll test suite |
| **Config file** | `package.json`, `tsconfig.json`, `.github/workflows/ci.yml` |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npx tsc --noEmit && npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint && npx tsc --noEmit && npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | MKTG-01 | T-2-01 | Message hierarchy explains product clearly without drifting from locked CTA intent | static | `npm run lint` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | MKTG-02 | T-2-02 | Root route renders the fuller landing experience without breaking compile or existing tests | integration | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 3 | MKTG-03 | T-2-03 | CTA destinations and demo-entry hierarchy are explicit and regression-checked | regression | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Existing infrastructure covers lint, typecheck, and tests for this phase.
- [ ] Manual visual checks for hero clarity, CTA hierarchy, and mobile layout are documented in plan tasks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero explains QRShift within seconds while still feeling bold and branded | MKTG-01 | Messaging clarity and brand punch need human judgment | Open `/` on desktop and mobile widths and confirm the first screen communicates the product quickly without feeling generic |
| Section order and narrative flow match the agreed one-page structure | MKTG-02 | Requires reading the page as a visitor rather than checking code tokens | Scroll the landing page and confirm the order is hero -> how it works -> benefits -> best-fit businesses -> CTA close |
| Public CTAs dominate while internal demo access is visibly secondary | MKTG-03, UX-03 | Visual hierarchy cannot be fully asserted via CLI checks | Confirm `Request a Demo` and `Contact` are the primary conversion actions and `/admin/create-store` remains available but lower priority |
| Local-storage resume behavior still works | UX-03 | Requires runtime/browser behavior validation | Seed `last_scan_token` or `last_dashboard_token` in local storage and confirm the root route still redirects appropriately |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or existing infrastructure
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
