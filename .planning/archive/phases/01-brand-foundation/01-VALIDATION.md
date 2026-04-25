---
phase: 1
slug: brand-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Next.js lint + TypeScript compiler + custom Node payroll tests |
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
| 1-01-01 | 01 | 1 | BRAND-01 | T-1-01 | Shared brand tokens and rules are centralized instead of ad hoc | static | `npm run lint` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | BRAND-01 | T-1-02 | Global shell and styles compile cleanly after refactor | integration | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | BRAND-03 | T-1-03 | Reusable guidance and proof surfaces exist for later phases | regression | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Existing infrastructure covers lint, typecheck, and tests for this phase.
- [ ] Manual visual verification checklist is documented inside the plan tasks for the proof surface.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headline and body typography feel clearly differentiated | BRAND-01 | Brand tone cannot be fully asserted by CLI checks | Open the root page, confirm expressive display type appears in headline moments while body/UI text stays readable |
| Electric palette and QR-inspired motifs feel present but not noisy | BRAND-01 | Visual balance is subjective and needs human review | Open the proof surface in light and dark mode and verify motifs are structural accents, not distracting backgrounds |
| Component language feels crisp and structured | BRAND-03 | Requires visual judgment across multiple UI primitives | Review updated buttons, cards, panels, and surface patterns on the proof surface and check they avoid oversized soft rounding |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or existing infrastructure
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
