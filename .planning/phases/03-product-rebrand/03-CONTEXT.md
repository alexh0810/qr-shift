# Phase 3: Product Rebrand - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply the new QRShift identity and UX polish across the core demo product surfaces without breaking attendance or reporting behavior. This phase should turn the scan, dashboard, reports, and admin flows into a more coherent and trustworthy product experience, while preserving the existing QR-based workflow and keeping the landing page showcase grounded in what the product actually looks like.

</domain>

<decisions>
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product direction
- `.planning/PROJECT.md` — Product framing, target customer, business constraints, and milestone priorities.
- `.planning/REQUIREMENTS.md` — Phase-mapped requirements for `BRAND-02`, `UX-01`, and `UX-02`.
- `.planning/ROADMAP.md` §Phase 3 — Scope boundary, success criteria, and planned work areas for Product Rebrand.
- `.planning/STATE.md` — Current project status, active concerns, and phase continuity.

### Prior brand and landing decisions
- `.planning/archive/phases/01-brand-foundation/01-CONTEXT.md` — Locked brand personality, typography, motif, and surface decisions.
- `.planning/archive/phases/01-brand-foundation/01-BRAND-SYSTEM.md` — Canonical QRShift token, typography, and component language guidance.
- `.planning/archive/phases/01-brand-foundation/01-BRAND-USAGE.md` — Guidance for applying the brand system consistently across surfaces.
- `.planning/archive/phases/02-landing-page/02-CONTEXT.md` — Locked landing-page product story, CTA hierarchy, and preview intent.
- `.planning/archive/phases/02-landing-page/02-UI-SPEC.md` — Landing-page design contract that product surfaces should visually align with where appropriate.

### Codebase context
- `.planning/codebase/ARCHITECTURE.md` — Current route shape, client/server boundaries, and report module organization.
- `.planning/codebase/CONVENTIONS.md` — Styling, naming, and maintainability conventions the redesign should respect.
- `.planning/codebase/STRUCTURE.md` — Directory layout and likely integration points for shared workspace components.
- `.planning/codebase/CONCERNS.md` — Current demo risks, especially around client-only access control and real-time data reads.

### Existing implementation surfaces
- `src/app/layout.tsx` — Global shell, metadata, and shared app wrapper entry point.
- `src/app/globals.css` — Shared tokens, theme rules, and brand utilities already in place.
- `src/app/page.tsx` — Landing page that should eventually showcase real redesigned product surfaces more accurately.
- `src/app/scan/[qr_token]/page.tsx` — Employee-facing scan flow that must stay simple and task-oriented.
- `src/app/dashboard/[qr_token]/page.tsx` — Manager-facing dashboard that should become the primary rebrand anchor.
- `src/app/reports/[qr_token]/page.tsx` — Manager-facing reports experience that should unify with the dashboard workspace.
- `src/app/admin/create-store/page.tsx` — Internal admin flow that should become a cleaner branded internal tool.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/globals.css`: Shared brand tokens and QRShift motif utilities already exist and should be the styling base for the rebrand.
- `src/app/layout.tsx`: The top-level app shell can be extended to support stronger cross-product presentation.
- `src/components/BrandMark.tsx`: Existing brand primitive can help connect public and product-facing surfaces.
- `src/components/PinGuard.tsx`: Existing manager gating pattern needs to remain intact while the manager workspace is redesigned.
- `src/features/reports/components/*`: Reports already have the strongest component modularity in the codebase and provide a good foundation for a more polished workspace.

### Established Patterns
- Manager access is still gated client-side, so the redesign should clarify surface boundaries visually without pretending the security model is stronger than it is.
- The app is mobile-first, so any new shared shell has to remain usable on small screens and not bury the primary actions.
- Dashboard and reports already share the same route-level context around a `qr_token`, which supports treating them as one connected manager workspace.
- The scan flow is currently a standalone interaction model, so preserving that separation matches both the codebase shape and the product intent.

### Integration Points
- Shared manager-shell components will likely connect at the dashboard and reports route level rather than being forced onto the scan flow.
- The landing page can later reuse updated product visuals once dashboard, reports, and scan have stable redesigned surfaces.
- Admin-specific polish should stay localized to `src/app/admin/create-store/page.tsx` so internal tooling remains distinct from customer-facing and manager-facing product flows.

</code_context>

<specifics>
## Specific Ideas

- The product should feel like one honest and coherent system rather than a marketing page plus an older-looking demo.
- The landing page preview should reflect the real redesigned app UI rather than a conceptual proof panel.
- The manager journey should read clearly as `Scan -> Monitor -> Export`, with the dashboard carrying the strongest first impression.
- Employees using the scan route should only see what they need to clock in or out, with no bleed of manager or admin surfaces.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-product-rebrand*
*Context gathered: 2026-04-09*
