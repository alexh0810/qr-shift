# Phase 1: Brand Foundation - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the brand language and reusable interface foundation for QRShift. This phase defines the visual direction, shared styling primitives, and reusable UI rules that the landing page and refreshed product screens will build on in later phases. It does not include building the landing page content itself or redesigning all product screens yet.

</domain>

<decisions>
## Implementation Decisions

### Brand personality
- **D-01:** QRShift should feel modern and bold rather than neutral, quiet, or utilitarian.
- **D-02:** The brand should create a strong first impression suitable for customer and investor demos without drifting into something gimmicky.

### Typography direction
- **D-03:** Use expressive headline typography for high-visibility brand moments such as hero sections, major headers, and other signature surfaces.
- **D-04:** Keep body text and product UI typography clean, readable, and operational so usability stays strong in product flows.

### Color and signature motifs
- **D-05:** Move beyond a generic blue SaaS palette into a more distinctive electric visual system.
- **D-06:** Use QR-inspired geometric cues, grid structure, or scan-like square motifs as part of the identity system.
- **D-07:** The motif should reinforce the product name and concept, but should not become playful noise or overpower core content.

### Surface and component language
- **D-08:** Core UI components should feel crisp and structured rather than soft and rounded.
- **D-09:** Buttons, cards, panels, inputs, and layout blocks should align to a more confident, system-like visual rhythm that supports the QR-inspired identity.

### the agent's Discretion
- Exact font pairings, provided they match the expressive-headline plus clean-body split.
- Exact palette values, provided they stay bold, electric, and coherent across light and dark surfaces.
- Exact implementation of QR-inspired motifs, provided they support the brand without reducing clarity.
- Motion and micro-interaction details, provided they enhance the polished feel without slowing down operational flows.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product direction
- `.planning/PROJECT.md` — Product framing, core value, target customer, business positioning, and release constraints for this milestone.
- `.planning/REQUIREMENTS.md` — Phase-mapped requirements for the brand system and overall demo release.
- `.planning/ROADMAP.md` §Phase 1 — Scope boundary, success criteria, and plan slots for Brand Foundation.
- `.planning/STATE.md` — Current project position and active concerns that must not be ignored during design work.

### Codebase context
- `.planning/codebase/CONVENTIONS.md` — Existing styling, component, and maintainability conventions the brand system should respect.
- `.planning/codebase/STRUCTURE.md` — Route and module layout, especially where shared styling and future UI work will land.
- `.planning/codebase/STACK.md` — Current framework, styling stack, and deployment constraints.

### Existing implementation surfaces
- `src/app/layout.tsx` — Current global shell, font setup, theme provider, and top-level app metadata.
- `src/app/globals.css` — Current color tokens and baseline styling entry point for global brand primitives.
- `src/app/page.tsx` — Current home page surface that will eventually be replaced by a stronger public-facing entry experience.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/globals.css`: Existing CSS custom properties for colors and shared visual tokens can evolve into a fuller brand token system.
- `src/app/layout.tsx`: Global font wiring and theme/provider setup provide the natural integration point for typography and app-wide visual rules.
- `src/components/ThemeProvider` and `src/components/ThemeToggle`: Existing theming hooks mean the new brand system should account for both light and dark presentation.

### Established Patterns
- Tailwind utilities plus CSS variables are the current styling model, so the brand system should extend that approach instead of introducing a second styling paradigm.
- Route pages currently own much of their presentation directly, which means Phase 1 should favor shared primitives and conventions that later phases can apply gradually.
- The app is mobile-first and operational in nature, so bold styling must coexist with fast scanning, clear tables, and readable reports.

### Integration Points
- Global brand primitives will likely live first in `src/app/globals.css` and `src/app/layout.tsx`.
- Shared visual components or wrappers can be introduced under `src/components/` for reuse across landing and product surfaces.
- The eventual landing page and refreshed app screens will inherit decisions from this phase, especially in `/`, `/scan/[qr_token]`, `/dashboard/[qr_token]`, and `/reports/[qr_token]`.

</code_context>

<specifics>
## Specific Ideas

- The brand should feel like a real product, not just a generic internal tool.
- The overall tone should stay clean and operational, but with enough distinctiveness to feel unmistakably QRShift.
- The identity should use QR-related geometry as a meaningful motif, not as decoration for its own sake.
- Bold brand moments belong in the right places, while core product interactions still need to feel calm, readable, and efficient.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-brand-foundation*
*Context gathered: 2026-04-09*
