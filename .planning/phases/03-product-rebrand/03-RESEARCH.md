# Phase 03: Product Rebrand - Research

**Researched:** 2026-04-10
**Domain:** Product-surface rebrand and UX polish for a client-first Next.js App Router app
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Product story and visual anchor
- **D-01:** The product should communicate a complete workflow of `Scan -> Monitor -> Export`.
- **D-02:** The dashboard should be the main visual anchor for the rebrand because it best communicates live operational value at a glance.
- **D-03:** The landing page product showcase should ultimately be rebuilt from the actual redesigned product screens rather than conceptual mock panels.

### Rebrand depth and priority
- **D-04:** Phase 3 should be a deep redesign, not just a surface-level visual refresh.
- **D-05:** The redesign should optimize for operational clarity first rather than pure minimalism or visual spectacle.
- **D-06:** The result should feel like a real, cohesive product and not a collection of unrelated screens.

### Surface boundaries
- **D-07:** Manager-facing screens should feel like one connected product with a shared presentation and navigation system.
- **D-08:** The employee-facing `/scan/[qr_token]` route should remain standalone and task-focused, not part of the manager workspace.
- **D-09:** The `/admin/create-store` route should remain owner-only and separate from the customer-facing or manager-facing experience.

### Manager workspace direction
- **D-10:** The manager-facing shell should feel like a polished workspace rather than a bare operational console.
- **D-11:** The dashboard and reports pages should feel strongly unified through shared shell, structure, headers, cards, filters, and table language.
- **D-12:** The reports surface should still preserve payroll readability, but it should visually belong to the same workspace as the dashboard.

### Employee and admin surfaces
- **D-13:** The scan experience should be clearly branded as QRShift, but still stripped down enough to stay fast and employee-simple.
- **D-14:** The admin/create-store experience should be a branded internal tool rather than an unstyled utility screen.

### the agent's Discretion
- Exact navigation model for the connected manager workspace, provided dashboard and reports clearly feel like one system.
- Exact layout, card, and table treatment, provided operational clarity stays stronger than decoration.
- Exact method for reusing redesigned product visuals on the landing page after the product surfaces are updated.
- Exact empty, loading, and transition state styling, provided all core flows remain fast and understandable.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-02 | The overall interface feels clean, operational, and distinctly QRShift rather than generic dashboard UI | Shared token reuse, a single manager-shell language, scan/admin surface rules, and PWA brand cleanup support this directly. [VERIFIED: codebase grep] [VERIFIED: 03-UI-SPEC.md] |
| UX-01 | Existing scan, dashboard, reports, and admin demo flows remain functional after the visual refresh | Preserve route-local data logic, `PinGuard`, existing db helpers, report modules, and current routes; validate with `npm test`, `npm run lint`, and `npm run build`. [VERIFIED: codebase grep] [VERIFIED: local command] |
| UX-02 | Core product screens remain clear and usable on both mobile and desktop after redesign | Use Tailwind breakpoint variants already in the repo and keep mobile-first stacked controls on scan, dashboard, reports, and admin. [VERIFIED: codebase grep] [CITED: https://tailwindcss.com/docs/responsive-design] |
</phase_requirements>

## Summary

Phase 3 should be planned as a UI-system consolidation phase, not a routing rewrite or data-layer rewrite. Dashboard and reports already share the same `qr_token` context, the reports feature already has extracted components, and the current brand tokens/fonts already live in `src/app/layout.tsx` and `src/app/globals.css`; the safest plan is therefore to add shared workspace primitives and apply them across the existing pages rather than changing route behavior. [VERIFIED: codebase grep]

The strongest implementation pattern is: keep scan standalone, keep admin separate, and make dashboard plus reports feel like one manager workspace by extracting shared shell/header/action primitives into reusable components. That satisfies the locked surface boundaries while minimizing regression risk to attendance writes, realtime dashboard updates, and report export/edit behavior. [VERIFIED: 03-CONTEXT.md] [VERIFIED: codebase grep]

One genuine runtime-state issue exists beyond normal file edits: the installed PWA surface still exposes `Shiftly` in `public/manifest.json`, so this phase should include manifest cleanup and a user-facing note that already-installed PWAs may need refresh/reinstall to pick up the new name/theme. [VERIFIED: codebase grep] [VERIFIED: local file read]

**Primary recommendation:** Use a component-first rebrand: shared manager shell primitives for dashboard/reports, dedicated scan/admin treatments, zero new UI libraries, and explicit regression checks on scan, live board, reports, export, and store creation. [VERIFIED: codebase grep] [VERIFIED: 03-UI-SPEC.md]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `14.2.35` (published 2025-12-11) [VERIFIED: npm registry] | App Router routes, metadata, build, and deployment shell | The repo already uses App Router routes under `src/app`, and this phase does not require a framework upgrade to deliver the rebrand. [VERIFIED: codebase grep] |
| `react` | `18.3.1` (published 2024-04-26) [VERIFIED: npm registry] | Route UI, local state, and client interactions | All target routes are client-driven and already use local React state and effects. [VERIFIED: codebase grep] |
| `tailwindcss` | `3.4.1` (published 2024-01-05) [VERIFIED: npm registry] | Utility styling and responsive variants | The UI contract explicitly keeps the current Tailwind plus CSS-variable system instead of introducing a new component library. [VERIFIED: 03-UI-SPEC.md] [VERIFIED: codebase grep] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/font` | bundled with Next `14.2.35` [VERIFIED: package.json] | Central font loading for `Space Grotesk`, `Geist`, and `Geist Mono` | Keep all font wiring in `src/app/layout.tsx`; do not re-import fonts per route. [VERIFIED: codebase grep] [CITED: https://nextjs.org/docs/14/app/building-your-application/optimizing/fonts] |
| `next-themes` | `0.4.6` (published 2025-03-11) [VERIFIED: npm registry] | Global light/dark theme switching | Reuse the existing `ThemeProvider`; do not add route-specific theme logic. [VERIFIED: codebase grep] |
| `lucide-react` | `1.7.0` (published 2026-03-25) [VERIFIED: npm registry] | Existing icon set | The UI spec locks `lucide-react`; use it consistently across shell, status, and actions. [VERIFIED: 03-UI-SPEC.md] [VERIFIED: package.json] |
| `firebase` | `12.11.0` in repo, `12.12.0` latest registry as of 2026-04-10 [VERIFIED: npm registry] | Browser Firestore reads/writes | Keep the current Firebase layer unchanged in this phase; the rebrand should not bundle a data-access rewrite. [VERIFIED: codebase grep] |
| `date-fns` | `4.1.0` (published 2024-09-17) [VERIFIED: npm registry] | Time/date formatting on scan, dashboard, and reports | Reuse for status timestamps and report date ranges; do not hand-format dates. [VERIFIED: codebase grep] |
| `qrcode.react` | `4.2.0` (published 2024-12-11) [VERIFIED: npm registry] | QR rendering for admin store creation | Keep QR generation behavior intact while restyling the admin success surface. [VERIFIED: codebase grep] |
| `nanoid` | `5.1.7` (published 2026-03-15) [VERIFIED: npm registry] | Store token generation | Keep token generation unchanged in admin flows. [VERIFIED: codebase grep] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing Tailwind + CSS variables [VERIFIED: codebase grep] | A new component library [ASSUMED] | A new library would add migration overhead and conflict with the locked “shared primitives, not a new library” direction. [VERIFIED: 03-UI-SPEC.md] |
| Shared shell components inside current pages [VERIFIED: codebase grep] | Route-tree reorganization with new nested segments [CITED: https://nextjs.org/docs/14/app/building-your-application/routing/pages-and-layouts] | A route-tree move is valid in Next.js, but this phase’s value is product polish, not path/layout churn. [VERIFIED: 03-CONTEXT.md] |
| Existing report components and data-processing modules [VERIFIED: codebase grep] | Rebuilding reports UI from scratch [ASSUMED] | Rebuild-from-zero increases regression risk around inline edits, totals, and export behavior. [VERIFIED: codebase grep] |

**Installation:**
```bash
# No new packages recommended for Phase 3.
```

**Version verification:** Recommended package versions for this phase are the repo’s current versions, verified against `package.json` and npm publish data; no package upgrade is required to satisfy Phase 3. [VERIFIED: package.json] [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/
│   ├── dashboard/[qr_token]/page.tsx    # keep data subscription logic here
│   ├── reports/[qr_token]/page.tsx      # keep report orchestration logic here
│   ├── scan/[qr_token]/page.tsx         # keep standalone employee flow
│   └── admin/create-store/page.tsx      # keep owner-only setup flow
├── components/
│   ├── workspace/                       # add shared manager shell/header/nav/action primitives
│   └── feedback/                        # optional shared empty/error/loading blocks
└── features/reports/components/         # keep report-specific tables/cards/selectors
```
[VERIFIED: codebase grep]

### Pattern 1: Shared Manager Shell Component
**What:** Extract a reusable workspace wrapper for dashboard and reports only: shared page width, header structure, lightweight dashboard/reports navigation, action bar slots, lock action placement, and panel wrappers. [VERIFIED: 03-CONTEXT.md] [VERIFIED: 03-UI-SPEC.md] [VERIFIED: codebase grep]

**When to use:** Use on `/dashboard/[qr_token]` and `/reports/[qr_token]` because those are the locked manager-facing surfaces that must read as one system. [VERIFIED: 03-CONTEXT.md]

**Why this pattern:** The current pages already duplicate header, lock, and navigation affordances while keeping different data logic. Shared UI components reduce duplication without disturbing page-specific Firestore/report orchestration. [VERIFIED: codebase grep]

**Example:**
```tsx
// Source basis: repo route structure + locked Phase 3 UI contract
<ManagerWorkspaceShell
  title="Live Board"
  subtitle={store.name}
  qrToken={params.qr_token}
  nav={[
    { href: `/dashboard/${params.qr_token}`, label: "Dashboard" },
    { href: `/reports/${params.qr_token}`, label: "Reports" },
  ]}
  actions={<OnShiftChip count={onShiftEmployees.length} />}
>
  <DashboardPanels />
</ManagerWorkspaceShell>
```

### Pattern 2: Standalone Scan Surface
**What:** Rebrand `/scan/[qr_token]` with QRShift typography/tokens and stronger success/error/loading states, but keep the single-column, employee-first flow and avoid manager navigation chrome. [VERIFIED: 03-CONTEXT.md] [VERIFIED: 03-UI-SPEC.md] [VERIFIED: codebase grep]

**When to use:** Use only on the employee scan route. [VERIFIED: 03-CONTEXT.md]

**Why this pattern:** The current scan page already models a focused pick-name -> determine action -> clock action loop; the phase should improve trust and clarity around that loop, not introduce workspace complexity. [VERIFIED: codebase grep]

**Example:**
```tsx
// Source basis: existing scan flow in src/app/scan/[qr_token]/page.tsx
<ScanSurface
  storeName={store.name}
  status={nextAction}
  onBack={() => setSelectedEmployee(null)}
>
  <ClockActionButton nextAction={nextAction} loading={actionLoading} />
</ScanSurface>
```

### Pattern 3: Reports UI Around Existing Report Modules
**What:** Keep `buildReportData`, `updateRowTime`, `rebuildEmployeeReport`, CSV export, and the existing report components as the behavioral core; redesign wrappers, headings, filters, summary cards, and table treatment around them. [VERIFIED: codebase grep]

**When to use:** Use for all report-page redesign work. [VERIFIED: codebase grep]

**Why this pattern:** Reports are already the most modular slice of the repo and provide the best low-risk insertion point for shared product styling. [VERIFIED: STATE.md] [VERIFIED: codebase grep]

**Example:**
```tsx
// Source: /Users/alex/projects/QRShift/src/app/reports/[qr_token]/page.tsx
<WorkspacePanel>
  <EmployeeSelect ... />
</WorkspacePanel>
<WorkspacePanel>
  <AllEmployeesTimesheetTable
    reports={reportData}
    emptyMessage={allEmployeesEmptyMessage}
    onTimeChange={updateTimesheetRow}
  />
</WorkspacePanel>
```

### Pattern 4: Contextual Inline Feedback, Not Browser Alerts
**What:** Replace route-level `alert()` usage and detached error messaging with inline page-context feedback blocks and button-local loading affordances. [VERIFIED: 03-UI-SPEC.md] [VERIFIED: codebase grep]

**When to use:** Admin failures, route fetch errors, export refresh/loading states, unlock/loading states, and scan success/error transitions. [VERIFIED: 03-UI-SPEC.md] [VERIFIED: codebase grep]

**Example:**
```tsx
// Source basis: Next route loading guidance + Phase 3 interaction contract
{error ? <InlineError message={error} /> : null}
<button disabled={loading}>
  {loading ? <Loader2 className="animate-spin" /> : "Create Store & Generate QR"}
</button>
```

### Anti-Patterns to Avoid
- **Putting scan inside the manager workspace:** This violates locked surface boundaries and makes the employee task slower. [VERIFIED: 03-CONTEXT.md]
- **Introducing a new route palette per page:** The UI contract explicitly requires reuse of the semantic token layer in `src/app/globals.css`. [VERIFIED: 03-UI-SPEC.md] [VERIFIED: codebase grep]
- **Rewriting report behavior while restyling report UI:** This phase needs visual polish, not payroll-logic churn. [VERIFIED: REQUIREMENTS.md] [VERIFIED: codebase grep]
- **Using visual lock polish to imply real security:** `PinGuard` remains client-side and demo-only. [VERIFIED: codebase grep] [VERIFIED: CONCERNS.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shared design tokens | Per-route custom colors/radii/shadows | Existing semantic token layer in `src/app/globals.css` | The brand foundation already established the exact token system and reuse rules. [VERIFIED: 01-BRAND-SYSTEM.md] [VERIFIED: 01-BRAND-USAGE.md] [VERIFIED: codebase grep] |
| Font loading | Route-level font imports | Root-level `next/font` setup in `src/app/layout.tsx` | Next.js already provides centralized font optimization and the repo already uses it correctly. [VERIFIED: codebase grep] [CITED: https://nextjs.org/docs/14/app/building-your-application/optimizing/fonts] |
| Responsive behavior | Custom media-query stylesheet branch | Tailwind responsive variants already configured in the repo | Tailwind’s breakpoint system is already present and matches the UI spec’s mobile-first requirements. [VERIFIED: codebase grep] [CITED: https://tailwindcss.com/docs/responsive-design] |
| Manager workspace state | New global store for this phase | Existing page-local state plus shared shell components | Current routes are simple enough that UI unification does not require Zustand/Redux/React Query. [VERIFIED: AGENTS.md] [VERIFIED: codebase grep] |
| Reports data logic | New payroll/report engine | Existing report modules under `src/features/reports/` | The calculation/export path already has tests and should stay stable through the redesign. [VERIFIED: codebase grep] [VERIFIED: local command] |
| Access control hardening | Faux “secure” front-end auth rewrite | Existing `PinGuard` behavior, visually clarified as demo-only | Real auth is explicitly deferred to v2. [VERIFIED: REQUIREMENTS.md] [VERIFIED: PROJECT.md] |

**Key insight:** The right implementation boundary is UI composition around existing behavior, not new infrastructure. [VERIFIED: codebase grep] [VERIFIED: REQUIREMENTS.md]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — verified: current Firestore-facing code stores `store`, `employee`, and `timelog` domain data; this phase does not rename persisted collection keys, document keys, or user identifiers. [VERIFIED: codebase grep] | Code edits only; no data migration required. [VERIFIED: codebase grep] |
| Live service config | None in scope — this phase stays inside the existing app and simple CTA model; no separate marketing/admin service config was identified in repo context. [VERIFIED: PROJECT.md] [VERIFIED: AGENTS.md] | None. [VERIFIED: PROJECT.md] |
| OS-registered state | Installed PWA metadata can retain the old app name because `public/manifest.json` still says `Shiftly`; users who already installed the app may continue to see the stale name/theme until the install refreshes. [VERIFIED: local file read] [VERIFIED: CONCERNS.md] | Code edit `public/manifest.json`, keep `src/app/layout.tsx` metadata aligned, and add a manual refresh/reinstall note for already-installed PWAs; no data migration. [VERIFIED: codebase grep] |
| Secrets/env vars | No brand-coupled env var names were found; the repo only references browser-safe Firebase config keys like `NEXT_PUBLIC_FIREBASE_*`. [VERIFIED: codebase grep] | None for rebrand; keep env var names unchanged. [VERIFIED: codebase grep] |
| Build artifacts | `.next` output and installed PWA assets can remain stale after manifest/icon/meta changes. [VERIFIED: local command] [VERIFIED: codebase grep] | Rebuild with `npm run build`; expect browser/PWA cache refresh for manifest/name updates. [VERIFIED: local command] |

## Common Pitfalls

### Pitfall 1: Conflating UI Unification With Route Refactoring
**What goes wrong:** Planning turns a polish phase into route-tree churn or layout rewrites that are larger than the requirement. [VERIFIED: REQUIREMENTS.md]
**Why it happens:** Dashboard and reports look inconsistent today, so it is tempting to “fix” that by reorganizing routes rather than extracting shared UI. [VERIFIED: codebase grep]
**How to avoid:** Keep current paths and data logic; extract shared shell/header/panel/action primitives instead. [VERIFIED: codebase grep]
**Warning signs:** Large edits to routing structure before any shared components exist. [VERIFIED: codebase grep]

### Pitfall 2: Breaking Report Behavior While Restyling Reports
**What goes wrong:** Inline edit, summary, range filtering, or CSV export regress while changing table/card UI. [VERIFIED: codebase grep]
**Why it happens:** The reports page mixes orchestration and presentation, so visual edits can accidentally touch behavior. [VERIFIED: codebase grep]
**How to avoid:** Treat `src/features/reports/data-processing.ts`, `export.ts`, and existing components as stable behavior boundaries. [VERIFIED: codebase grep]
**Warning signs:** Changes inside report calculation/export modules without a requirement-driven reason. [VERIFIED: REQUIREMENTS.md] [VERIFIED: codebase grep]

### Pitfall 3: Over-branding Work-Critical Screens
**What goes wrong:** Dense gradients, decorative motifs, oversized display typography, or excessive motion reduce readability on scan, dashboard, and reports. [VERIFIED: 01-BRAND-SYSTEM.md] [VERIFIED: 03-UI-SPEC.md]
**Why it happens:** The landing page pushes the brand harder, and that treatment does not transfer directly to operational screens. [VERIFIED: 02-UI-SPEC.md] [VERIFIED: 03-UI-SPEC.md]
**How to avoid:** Keep calmer neutrals, restrained QR motifs, and use accent as signal instead of ambient decoration. [VERIFIED: 03-UI-SPEC.md]
**Warning signs:** Accent fills on every badge/row/button or display font inside dense tables/forms. [VERIFIED: 03-UI-SPEC.md]

### Pitfall 4: Leaving `alert()` and Detached Error States Intact
**What goes wrong:** The app looks rebranded but still behaves like a prototype during failures. [VERIFIED: codebase grep]
**Why it happens:** Admin failures currently use `alert()`, and route error handling is inconsistent. [VERIFIED: codebase grep]
**How to avoid:** Convert route failures to inline error surfaces and action-local loading states. [VERIFIED: 03-UI-SPEC.md]
**Warning signs:** Browser modal alerts remain in user-facing flows after redesign. [VERIFIED: codebase grep]

### Pitfall 5: Missing the Installed PWA Brand Cleanup
**What goes wrong:** The UI says QRShift while the installed app still says `Shiftly`, undermining the rebrand. [VERIFIED: local file read] [VERIFIED: CONCERNS.md]
**Why it happens:** Manifest/service worker files are outside route UI code, so they are easy to miss during visual work. [VERIFIED: codebase grep]
**How to avoid:** Include `public/manifest.json` and a PWA refresh check in the phase plan. [VERIFIED: local file read]
**Warning signs:** Home-screen install title or icon metadata still shows `Shiftly` after UI changes ship. [VERIFIED: local file read]

## Code Examples

Verified patterns from official sources and the current codebase:

### Shared Manager Workspace Wrapper
```tsx
// Source basis: existing dashboard/reports route duplication + Phase 3 shell contract
export function ManagerWorkspaceShell({
  title,
  subtitle,
  nav,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  nav: { href: string; label: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-[var(--radius-panel)] border border-surfacestroke bg-surface p-6 shadow-[var(--shadow-panel)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Manager Workspace
              </p>
              <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
              <p className="text-sm text-text-muted">{subtitle}</p>
            </div>
            <nav className="flex gap-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full border px-4 py-2">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          {actions}
        </header>
        {children}
      </div>
    </div>
  );
}
```

### Route-Level Loading File Pattern
```tsx
// Source: https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming
export default function Loading() {
  return <LoadingSkeleton />;
}
```

### Tailwind Breakpoint Pattern For Adaptive Controls
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
  <button className="w-full sm:w-auto">Export Payroll Report</button>
  <button className="w-full sm:w-auto">Refresh</button>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| One-off page styling per route [VERIFIED: codebase grep] | Shared token layer plus reused workspace primitives [VERIFIED: 01-BRAND-SYSTEM.md] [VERIFIED: 03-UI-SPEC.md] | Project change started in Phase 1 on 2026-04-09. [VERIFIED: ROADMAP.md] | Phase 3 should extend the existing tokenized system instead of inventing new route styles. [VERIFIED: codebase grep] |
| Route-owned spinner/error blocks only [VERIFIED: codebase grep] | Route-segment `loading.js` plus Suspense is the App Router convention when route-level loading files are needed. [CITED: https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming] | Documented in Next.js 14 docs last updated 2024-04-08. [CITED: https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming] | Optional improvement: add `loading.tsx` only if it simplifies full-screen route loading; do not force it if current inline states remain clearer. [CITED: https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming] [VERIFIED: AGENTS.md] |
| Generic installed app branding (`Shiftly`) [VERIFIED: local file read] | Product-aligned metadata and manifest naming (`QRShift`) [VERIFIED: src/app/layout.tsx] | Needed in this phase. [VERIFIED: CONCERNS.md] | Required for brand consistency across browser and installed PWA surfaces. [VERIFIED: REQUIREMENTS.md] |

**Deprecated/outdated:**
- `alert()` as primary failure UX on redesigned surfaces: replace with inline contextual errors. [VERIFIED: 03-UI-SPEC.md] [VERIFIED: codebase grep]
- PWA app name `Shiftly`: replace with `QRShift` to match the rest of the product. [VERIFIED: local file read]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A new component library would add unnecessary migration overhead for this phase. [ASSUMED] | Standard Stack / Alternatives Considered | Low; the planner might over-constrain implementation style, but the locked UI contract still rules out introducing one by default. |
| A2 | Rebuilding reports UI from scratch would increase regression risk more than wrapping existing modules. [ASSUMED] | Standard Stack / Alternatives Considered | Medium; if the current report components prove too rigid, the planner may need to allow broader presentation refactors while preserving behavior. |

## Open Questions (RESOLVED)

1. **RESOLVED 2026-04-10: The manager shell should be implemented as shared components, not as an App Router layout refactor in Phase 3.**
   - What we know: Existing paths already work, and the phase value is visual coherence rather than routing changes. [VERIFIED: ROADMAP.md] [VERIFIED: codebase grep]
   - Resolution: Use shared `ManagerWorkspaceShell` and `ManagerWorkspaceHeader` primitives for dashboard and reports, preserving route structure while enabling the deep redesign required by D-04. [VERIFIED: 03-01-PLAN.md] [VERIFIED: 03-03-PLAN.md]
   - Why this closes the question: It keeps regression risk lower for realtime dashboard/report behavior while still forcing a workspace-level redesign instead of isolated cosmetic edits. [VERIFIED: 03-CONTEXT.md] [VERIFIED: 03-03-PLAN.md]

2. **RESOLVED 2026-04-10: Phase 3 should not include replacing the placeholder CTA values in `src/lib/site-config.ts`.**
   - What we know: `STATE.md` flags placeholder Calendly/contact values as an active concern before external demos. [VERIFIED: STATE.md]
   - Resolution: Leave CTA-value replacement out of Phase 3 because it is not required by `BRAND-02`, `UX-01`, or `UX-02`, and the current phase is scoped to product-surface redesign rather than site-config content changes. [VERIFIED: REQUIREMENTS.md] [VERIFIED: ROADMAP.md]
   - Why this closes the question: It preserves scope fidelity to the locked Phase 3 decisions while keeping the CTA cleanup visible as follow-on work before external demos. [VERIFIED: STATE.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js build, lint, and tests | ✓ | `v18.18.0` | — |
| npm | Package scripts | ✓ | `9.8.1` | — |
| `next lint` | Phase regression gate | ✓ | via local project scripts | — |
| `next build` | Phase regression gate | ✓ | via local project scripts | — |
| `sucrase-node` test entry | Existing `npm test` script | ✓ | transitively available through current install | Existing script already passes; no new action unless dependency drift breaks it later. [VERIFIED: AGENTS.md] [VERIFIED: local command] |

**Missing dependencies with no fallback:**
- None. [VERIFIED: local command]

**Missing dependencies with fallback:**
- None. [VERIFIED: local command]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Custom Node test entry via `sucrase-node` over `src/lib/payroll.test.ts`. [VERIFIED: package.json] [VERIFIED: local command] |
| Config file | none — repo has no Jest/Vitest/Pytest config. [VERIFIED: codebase grep] |
| Quick run command | `npm test` [VERIFIED: package.json] [VERIFIED: local command] |
| Full suite command | `npm run lint && npm test && npm run build` [VERIFIED: local command] |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-02 | Product surfaces feel consistently QRShift rather than generic | manual visual QA | none yet | ❌ Wave 0 |
| UX-01 | Scan, dashboard, reports, and admin still function after redesign | manual smoke + compile/regression floor | `npm run lint`, `npm test`, `npm run build` | ⚠️ Partial |
| UX-02 | Mobile and desktop remain usable after redesign | manual responsive QA | none yet | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` [VERIFIED: local command]
- **Per wave merge:** `npm run lint && npm test` [VERIFIED: local command]
- **Phase gate:** `npm run lint && npm test && npm run build` plus manual route QA on phone and desktop widths. [VERIFIED: local command]

### Wave 0 Gaps
- [ ] Add a concise manual smoke checklist covering `/scan/[qr_token]`, `/dashboard/[qr_token]`, `/reports/[qr_token]`, and `/admin/create-store`. [VERIFIED: REQUIREMENTS.md] [VERIFIED: codebase grep]
- [ ] Add at least one UI-level regression harness for route rendering or interaction if the planner wants automation beyond lint/build. [VERIFIED: codebase grep]
- [ ] Decide whether to keep relying on transitive `sucrase-node` or make it explicit later; it is not blocking this phase because `npm test` currently passes. [VERIFIED: AGENTS.md] [VERIFIED: local command]

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Real auth is deferred to v2; Phase 3 must not imply otherwise. [VERIFIED: REQUIREMENTS.md] |
| V3 Session Management | yes | Existing `localStorage` resume/unlock behavior remains demo-only and should be visually scoped accordingly. [VERIFIED: codebase grep] [VERIFIED: CONCERNS.md] |
| V4 Access Control | yes | Existing `PinGuard` client-side gate stays in place for manager routes; do not widen access during redesign. [VERIFIED: codebase grep] |
| V5 Input Validation | yes | Preserve current input constraints (`required`, numeric PIN fields, date inputs, employee selection) and do not weaken them in UI rewrites. [VERIFIED: codebase grep] |
| V6 Cryptography | no | No cryptographic feature work belongs in this phase. [VERIFIED: REQUIREMENTS.md] |

### Known Threat Patterns for This Stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Manager unlock spoofing through client-side PIN and cached unlock state | Spoofing | Preserve current route boundaries, keep lock controls obvious, and avoid copy/UI that implies production-grade security. [VERIFIED: codebase grep] [VERIFIED: CONCERNS.md] |
| Accidental privilege bleed from manager/admin chrome into scan flow | Elevation of Privilege | Keep scan standalone and never expose manager navigation/actions on `/scan/[qr_token]`. [VERIFIED: 03-CONTEXT.md] |
| Input misuse during admin/store setup | Tampering | Keep required fields, numeric PIN constraints, and inline error feedback during admin redesign. [VERIFIED: codebase grep] |
| Report/export inconsistency due to local-only edits | Repudiation | Avoid changing the local-only correction model in this phase; surface edits clearly and verify CSV export still matches current in-memory state. [VERIFIED: CONCERNS.md] [VERIFIED: codebase grep] |

## Sources

### Primary (HIGH confidence)
- `package.json`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/scan/[qr_token]/page.tsx`, `src/app/dashboard/[qr_token]/page.tsx`, `src/app/reports/[qr_token]/page.tsx`, `src/app/admin/create-store/page.tsx`, `src/components/BrandMark.tsx`, `src/components/PinGuard.tsx`, `src/features/reports/components/*` - current stack, route shape, shared primitives, and behavior boundaries. [VERIFIED: codebase grep]
- `.planning/phases/03-product-rebrand/03-CONTEXT.md` - locked decisions and surface boundaries. [VERIFIED: local file read]
- `.planning/phases/03-product-rebrand/03-UI-SPEC.md` - exact Phase 3 visual and interaction contract. [VERIFIED: local file read]
- `.planning/phases/01-brand-foundation/01-BRAND-SYSTEM.md` and `.planning/phases/01-brand-foundation/01-BRAND-USAGE.md` - brand reuse rules and token guardrails. [VERIFIED: local file read]
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/STRUCTURE.md` - requirements, phase boundaries, concerns, and codebase constraints. [VERIFIED: local file read]
- npm registry queries for `next`, `react`, `react-dom`, `tailwindcss`, `firebase`, `date-fns`, `qrcode.react`, `next-themes`, `nanoid`, and `lucide-react` - version and publish-date checks. [VERIFIED: npm registry]
- `npm test`, `npm run lint`, `npm run build`, `node -v`, `npm -v` - validation and environment checks. [VERIFIED: local command]
- `https://nextjs.org/docs/14/app/building-your-application/optimizing/fonts` - centralized font loading guidance. [CITED: https://nextjs.org/docs/14/app/building-your-application/optimizing/fonts]
- `https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming` - `loading.js` route-segment convention and shared-layout behavior during navigation. [CITED: https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming]
- `https://tailwindcss.com/docs/responsive-design` - breakpoint variant guidance used for mobile/desktop planning. [CITED: https://tailwindcss.com/docs/responsive-design]

### Secondary (MEDIUM confidence)
- None. [VERIFIED: this research session]

### Tertiary (LOW confidence)
- None beyond the explicit assumptions in `## Assumptions Log`. [VERIFIED: this research session]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - the phase keeps the existing stack, and package versions plus local commands were verified directly. [VERIFIED: npm registry] [VERIFIED: local command]
- Architecture: HIGH - the target routes, brand contract, and strongest low-risk extraction points are clear from locked context plus code inspection. [VERIFIED: 03-CONTEXT.md] [VERIFIED: codebase grep]
- Pitfalls: HIGH - the main risks are visible in current route code, planning artifacts, and local validation results. [VERIFIED: CONCERNS.md] [VERIFIED: codebase grep] [VERIFIED: local command]

**Research date:** 2026-04-10
**Valid until:** 2026-05-10
