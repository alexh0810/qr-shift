# Phase 1: Brand Foundation - Research

## Objective

Research what the planner needs to know to implement a reusable QRShift brand foundation in a Next.js + Tailwind + CSS-variable codebase without overbuilding the phase.

## Current Repo Reality

- The global brand entry points are already concentrated in `src/app/layout.tsx` and `src/app/globals.css`.
- The app already uses CSS custom properties for color tokens, which is the correct seam for a stronger design system.
- The current visual style is workable but inconsistent: some surfaces are highly rounded and soft, while others are more neutral or ad hoc.
- The homepage is minimal and internal-tool-like, so the brand foundation should prepare for a public-facing landing page without requiring that landing page to be fully built in this phase.

## Recommended Architecture

### 1. Token-first brand layer

For this repo, the cleanest foundation is:

1. Define a small, stable semantic token system in `src/app/globals.css`
2. Keep Tailwind utility usage, but route brand-sensitive values through CSS variables
3. Introduce a small set of reusable component classes or wrapper primitives for recurring surfaces

Recommended token groups:

- `--color-bg-*`
- `--color-surface-*`
- `--color-text-*`
- `--color-accent-*`
- `--color-border-*`
- `--radius-*`
- `--shadow-*`
- `--grid-*` or motif variables for QR-inspired geometry

Why this fits QRShift:

- It works with the current stack instead of fighting it
- It gives later phases one shared source of truth
- It avoids inventing a full design-system package too early

### 2. Two-tier typography system

The requested direction is expressive headlines plus clean operational body text. For this app, the safest pattern is:

- One display font for hero moments, section headers, and key callouts
- One UI/body font for paragraphs, forms, tables, dashboards, and reports

Implementation guidance:

- Keep the body/UI font highly legible at small sizes and in dense surfaces
- Use the display font sparingly so the product does not feel theatrical
- Define headline scales and tracking rules in one place so future pages do not improvise

Planning implication:

- The phase should include font selection and app-level wiring in `layout.tsx`
- It should also define usage rules, not just install fonts

### 3. Brand motif should be structural, not decorative

QR-inspired geometry is strongest when used as part of layout rhythm and emphasis rather than wallpaper.

Good uses:

- Corner accents
- Grid overlays or section dividers
- Repeating square modules in hero/marketing surfaces
- Framing devices for badges, stat cards, or callouts

Bad uses:

- Busy patterned backgrounds behind dense content
- Decorative QR-like noise inside forms and tables
- Literal QR-code visuals repeated everywhere

Planning implication:

- The phase should define motif rules and at least one reusable implementation pattern
- The motif should be introduced at the foundation level but applied selectively in later phases

### 4. Crisp structured component language

The chosen component direction suggests:

- Small or medium radii, not oversized pill-heavy softness everywhere
- Stronger borders and panel definition
- More deliberate spacing grid and alignment
- Higher confidence in layout blocks, especially cards, action buttons, stat surfaces, and tables

This does not require making everything sharp-edged. A better interpretation is:

- restrained radius
- firm outlines
- clean vertical rhythm
- controlled contrast

Planning implication:

- The phase should normalize core surface rules for buttons, cards, inputs, panels, and section containers
- It should avoid redesigning every feature screen now

## Recommended Build Strategy

### Plan shape

A good Phase 1 sequence is:

1. Define brand decisions as concrete design tokens and rules
2. Refactor global styling and app shell to support those decisions
3. Document reusable brand primitives and usage guidance for subsequent phases

That matches the existing roadmap well and keeps the work layered.

### Reusable outputs this phase should create

- Upgraded `globals.css` token system
- App-level font integration in `layout.tsx`
- Shared brand utilities or component primitives in `src/components/`
- A short brand usage document in the phase directory or docs-adjacent location
- A lightly refreshed root page or reference surface that proves the system works

## Risks and Anti-Patterns

### 1. Designing only for the landing page

Risk:
- The brand becomes visually exciting on the homepage but unusable in scan, dashboard, or reports.

Avoid by:
- Making legibility and operational density part of token decisions from the start

### 2. Over-indexing on soft SaaS aesthetics

Risk:
- The app keeps feeling generic and the QR concept never becomes a clear identity.

Avoid by:
- Using sharper structural cues and signature geometry

### 3. Over-indexing on graphic motifs

Risk:
- The UI becomes noisy, gimmicky, or hard to scan quickly.

Avoid by:
- Restricting motif usage to brand moments and structural accents

### 4. Creating too many tokens too early

Risk:
- The foundation becomes hard to maintain and later screens ignore it anyway.

Avoid by:
- Defining a compact semantic system first, then expanding only where needed

### 5. Forgetting dark mode compatibility

Risk:
- Strong electric colors become harsh or unreadable in dark mode.

Avoid by:
- Planning paired light/dark semantic tokens rather than one-off overrides

## File-Level Planning Guidance

### Highest-value files for this phase

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/` for any new shared brand primitives

### Files that should probably not change heavily in this phase

- `src/app/scan/[qr_token]/page.tsx`
- `src/app/dashboard/[qr_token]/page.tsx`
- `src/app/reports/[qr_token]/page.tsx`

Reason:
- Those belong more naturally to the next product rebrand phase. Phase 1 should give them a foundation, not redesign them wholesale.

## Validation Architecture

This phase is primarily UI foundation work, so validation should combine:

- fast static checks
- build correctness
- a small number of manual visual confirmations

Recommended verification mix:

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- manual check of the updated root/app-shell visual reference

Manual verification focus:

- headline/body font split is visible
- semantic token system exists and is actually used
- the visual language feels more structured and recognizably QRShift
- light and dark themes both remain usable

## Planning Recommendations

- Keep the phase to 3 focused plans, matching the roadmap:
  - direction and token rules
  - global style/app-shell refactor
  - documentation and proof surface
- Keep later-phase work out of this phase; do not fully redesign scan, dashboard, or reports yet
- Prefer semantic CSS variables plus Tailwind utilities over introducing a second styling framework
- Use one proof surface to validate the brand foundation before it spreads across the full app

## RESEARCH COMPLETE

Phase 1 should be planned as a token-first brand foundation for the existing Next.js app: define the brand system, wire it into the global shell, and create reusable primitives plus guidance that later landing-page and product-refresh phases can inherit.
