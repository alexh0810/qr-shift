# Phase 2: Landing Page - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship a public-facing landing page inside the existing QRShift app that quickly explains the product, shows how it works, highlights the core business value, and drives visitors toward either booking a demo or contacting the founder. This phase extends the current branded root route into a fuller one-page marketing experience, but does not yet redesign the rest of the product surfaces.

</domain>

<decisions>
## Implementation Decisions

### Hero direction
- **D-01:** The landing page hero should optimize for product punch first rather than pure minimal clarity or quiet trust-first messaging.
- **D-02:** The first screen should still explain QRShift quickly, but it should feel like a strong product-brand moment rather than a plain explainer block.

### Supporting content
- **D-03:** The strongest supporting sections after the hero should focus on how QRShift works plus its core benefits.
- **D-04:** The landing page should teach the simple workflow and business value without becoming content-heavy or drifting into generic SaaS filler.

### CTA hierarchy
- **D-05:** Public CTAs come first: `Request a Demo` and `Contact` should be the clearly prioritized actions.
- **D-06:** Internal demo/admin access should remain available, but it must be visually de-emphasized so the page reads as customer-facing first.

### Page depth and structure
- **D-07:** Phase 2 should produce a fuller one-page landing page rather than a tiny proof surface or a very minimal homepage.
- **D-08:** The section order after the hero should be: hero -> how it works -> benefits -> best-fit businesses -> CTA close.

### Product preview
- **D-09:** The landing page should include a static UI preview rather than relying only on illustrated blocks or purely conceptual visuals.
- **D-10:** The product preview should build trust quickly by making QRShift feel like a real working product, not an abstract concept.

### the agent's Discretion
- Exact section naming, provided the page keeps the agreed narrative order and remains easy to scan.
- Exact copy refinement, provided the tone stays product-forward, clean, and operational.
- Exact presentation of the static UI preview, provided it feels polished and believable within the current app constraints.
- Exact responsive layout, spacing, and motion details, provided mobile clarity stays strong.

</decisions>

<specifics>
## Specific Ideas

- The current root route is a starting point, not the final landing page.
- The landing page should feel more complete and public-facing than the current proof surface.
- The first impression should feel bold and branded, but still understandable within a few seconds.
- Public conversion paths should dominate the page, while founder/internal access remains available in a less prominent position.
- The page should use one-page storytelling rather than splitting visitors into separate marketing routes.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product direction
- `.planning/PROJECT.md` — Product framing, core value, target customer, and the milestone goal of turning QRShift into a polished demo-facing product.
- `.planning/REQUIREMENTS.md` — Phase-mapped landing-page requirements `MKTG-01`, `MKTG-02`, `MKTG-03`, `MKTG-04`, and `UX-03`.
- `.planning/ROADMAP.md` §Phase 2 — Landing page scope boundary, success criteria, and planned work slots.
- `.planning/STATE.md` — Current project status and active concerns, including the need to replace placeholder CTA targets.

### Brand foundation
- `.planning/phases/01-brand-foundation/01-CONTEXT.md` — Locked brand personality, typography, motif, and surface decisions from Phase 1.
- `.planning/phases/01-brand-foundation/01-BRAND-SYSTEM.md` — Canonical QRShift brand rules for typography, color, motif, component language, and motion.
- `.planning/phases/01-brand-foundation/01-BRAND-USAGE.md` — Reuse guidance for applying the Phase 1 brand layer to new surfaces.

### Codebase context
- `.planning/codebase/CONVENTIONS.md` — Existing styling and component conventions the landing page should respect.
- `.planning/codebase/STRUCTURE.md` — Where shared components and route-level changes should live.
- `.planning/codebase/STACK.md` — Current framework and styling stack constraints.

### Existing implementation surfaces
- `src/app/page.tsx` — Current homepage proof surface that Phase 2 will expand into the real landing page.
- `src/app/globals.css` — Shared QRShift token layer and brand utilities already in place.
- `src/app/layout.tsx` — Global shell, font wiring, metadata, and theme setup for the public page.
- `src/components/BrandMark.tsx` — Existing brand primitive available for reuse in the landing-page layout.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/page.tsx`: Already contains the initial hero, CTA wiring, best-fit section, and benefit framing that can be refactored into a fuller landing page instead of rebuilt from zero.
- `src/components/BrandMark.tsx`: Reusable brand mark and wordmark for the page header and other signature surfaces.
- `src/app/globals.css`: Semantic brand tokens, QR-grid utilities, and font utilities already support the visual direction from Phase 1.

### Established Patterns
- The app currently uses Tailwind plus CSS variables for styling, so the landing page should stay inside that system.
- The root route currently auto-resumes prior dashboard or scan sessions from local storage, so the landing page implementation must preserve that behavior.
- The product already exposes admin/demo access from the root route, so Phase 2 should refine its hierarchy rather than accidentally removing founder access.

### Integration Points
- `src/app/page.tsx` is the primary route to evolve for this phase.
- Reusable landing-page sections or supporting blocks can live under `src/components/` if that keeps the route cleaner.
- CTA destinations should remain simple: external Calendly, `mailto:`, and an internal path to `/admin/create-store`.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-landing-page*
*Context gathered: 2026-04-09*
