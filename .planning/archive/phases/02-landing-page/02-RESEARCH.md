# Phase 2: Landing Page - Research

## Objective

Research what the planner needs to know to turn the current QRShift proof surface into a polished one-page landing page that explains the product quickly, supports demo conversion, and stays consistent with the new brand system.

## Current Repo Reality

- The root route at `src/app/page.tsx` already contains a branded proof surface with hero copy, CTA buttons, best-fit business framing, and a secondary internal demo path.
- Phase 1 already established the visual system in `src/app/globals.css`, `src/app/layout.tsx`, and `src/components/BrandMark.tsx`, so this phase should build within a stable brand layer rather than inventing new styling rules.
- The current CTA destinations are placeholders: `https://calendly.com/your-handle` and `mailto:youremail@gmail.com?subject=QRShift%20Inquiry`.
- The app has no separate marketing infrastructure, so the landing page must remain inside the existing Next.js App Router structure.

## Recommended Architecture

### 1. Evolve the root route instead of introducing a second marketing route

For this repository, the cleanest approach is to keep the landing page on `/` and evolve the existing Phase 1 proof surface into a fuller one-page experience.

Why this fits:

- It preserves the current user entry point
- It respects the solo-builder simplicity constraint from `PROJECT.md`
- It avoids splitting brand and product logic across separate apps or layouts

Planning implication:

- Phase 2 should primarily modify `src/app/page.tsx`
- It may introduce a small set of reusable landing-page section components under `src/components/` if that improves maintainability

### 2. Use a narrative one-page structure with one strong above-the-fold promise

The locked section order is:

1. Hero
2. How it works
3. Core benefits
4. Best-fit businesses
5. CTA close

This order aligns well with the product goal:

- Visitors first understand what QRShift is
- Then they see how the simple workflow operates
- Then they see why it matters
- Then they self-identify as a target customer
- Then they convert

Planning implication:

- The content/messaging plan and the implementation plan should preserve this sequence
- The hero should remain the strongest visual and copy moment

### 3. Use a static product preview, not a full interactive demo

The user chose a static UI preview. In this codebase, the most practical version is a crafted product mock or interface snapshot embedded directly in the page markup.

Why this is preferred:

- It is stable for demo use
- It avoids adding a fake interactive prototype layer inside the route
- It keeps this phase focused on landing-page clarity instead of building parallel product states

Good execution options:

- A styled dashboard/reports composite card
- A small sequence of stacked product frames
- A browser-like surface showing attendance and reporting cues

Planning implication:

- The implementation plan should build a believable UI preview surface in the page or in a reusable component
- It should not rely on screenshots that are hard to theme or maintain unless the repo already uses that pattern

### 4. Public conversion should dominate while internal demo access remains available

The existing page already exposes `/admin/create-store`. The new hierarchy should:

- keep `Request a Demo` as the primary CTA
- keep `Contact` as the secondary public CTA
- keep internal founder/demo access present but visibly subordinate

This avoids turning the homepage into an internal tool while preserving founder workflow speed.

Planning implication:

- CTA placement and visual emphasis should be handled intentionally in both hero and closing sections
- Internal demo access likely belongs in a tertiary location such as a utility link, a smaller founder-only panel, or a footer-like support block

### 5. Preserve existing session auto-resume behavior

`src/app/page.tsx` currently redirects returning users to recent scan or dashboard routes via `localStorage`.

That behavior is operationally useful and should not be lost during landing-page work.

Planning implication:

- The landing page implementation must preserve the initial `useEffect` auto-resume logic
- Refactors should avoid moving this behavior into a way that breaks PWA home-screen launches

## UX and Content Guidance

### Hero behavior

The user wants product punch first, not a quiet trust-first hero.

That means:

- Bold display headline
- Fast subheadline with concrete value
- Strong, immediate CTA pair
- Product preview visible early, ideally above the fold on desktop

What to avoid:

- Generic "workforce management" abstractions
- Overly dense copy at the top
- Making the hero look like a generic internal dashboard header

### How-it-works section

This section should explain the QRShift workflow in a small number of steps.

Best pattern for this repo:

- 3-step or 4-step sequence
- Each step paired with a clear verb and outcome
- Visual treatment consistent with the structured QR motif language

Likely step narrative:

1. Create a QR station
2. Staff scan to clock in or out
3. Manager sees live shift visibility
4. Reports are exportable for payroll

### Benefits section

Benefits should stay specific to small businesses with hourly staff.

Good framing:

- No apps or logins for staff
- Faster visibility into who is on shift
- Cleaner payroll-ready exports

Bad framing:

- Broad operational-transformation claims
- Enterprise-scale language
- Empty "save time and money" clichés without product-specific grounding

### Best-fit businesses section

The current best-fit list is already directionally correct. It should likely be retained and polished rather than reimagined.

Good execution:

- Keep it concise
- Make it scan quickly
- Use it to help visitors self-qualify

### CTA close

The page should end with a stronger close than the current proof surface.

Recommended shape:

- Re-state the value succinctly
- Repeat primary and secondary public CTAs
- Keep founder/internal access separate from the main conversion close

## Risks and Anti-Patterns

### 1. Overloading the homepage

Risk:
- The page tries to do too much and becomes harder to scan within 10 seconds.

Avoid by:
- Keeping each section focused on one job
- Preserving a strong narrative order

### 2. Regressing into an internal tool homepage

Risk:
- Internal demo/admin access visually competes with public CTAs and weakens the customer-facing impression.

Avoid by:
- Making internal access clearly tertiary

### 3. Inventing a second visual language

Risk:
- The landing page drifts away from the Phase 1 brand foundation and makes the later product refresh harder.

Avoid by:
- Reusing the token layer, `BrandMark`, QR geometry, and structured surface rules already locked in Phase 1

### 4. Breaking operational resume behavior

Risk:
- Returning users lose the convenience of being redirected into the last-used scan or dashboard flow.

Avoid by:
- Preserving the existing `localStorage` resume logic at the top of the root route

### 5. Shipping placeholder CTAs as if they were production-ready

Risk:
- The landing page looks polished but routes demo prospects to obviously fake destinations.

Avoid by:
- Explicitly planning for real Calendly and email values, or at minimum isolating those constants so they are easy to replace

## File-Level Planning Guidance

### Highest-value files for this phase

- `src/app/page.tsx`
- `src/components/BrandMark.tsx`
- `src/app/globals.css`
- optional new landing-page section components under `src/components/`

### Files that should not change heavily in this phase

- `src/app/scan/[qr_token]/page.tsx`
- `src/app/dashboard/[qr_token]/page.tsx`
- `src/app/reports/[qr_token]/page.tsx`

Reason:
- Those belong to Phase 3 product rebrand work. Phase 2 should improve the landing page and its connection to the demo, not redesign the operational routes yet.

## Validation Architecture

This phase is branded frontend work with lightweight behavioral constraints. Validation should combine:

- lint correctness
- typecheck correctness
- existing test suite stability
- route-level manual review of layout, CTA hierarchy, and resume behavior

Recommended validation mix:

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- manual review of the `/` route on mobile and desktop widths

Manual verification focus:

- The first screen explains QRShift quickly while still feeling bold
- The section order follows the agreed one-page narrative
- `Request a Demo` and `Contact` dominate public conversion
- Internal demo access remains available but de-emphasized
- The page still auto-resumes previous scan/dashboard sessions when local storage tokens exist

## Planning Recommendations

- Keep the phase to the roadmap’s 3 plans:
  - content structure and messaging hierarchy
  - implementation of the fuller landing page and preview surfaces
  - clean integration of the landing page with demo entry points and real CTA destinations
- Separate copy and content architecture decisions from route implementation so execution stays clear
- Reuse Phase 1 brand primitives rather than introducing new ad hoc marketing styles
- Treat CTA realism and founder/internal access hierarchy as deliberate requirements, not cleanup

## RESEARCH COMPLETE

Phase 2 should be planned as a focused evolution of the existing root route: define the landing-page message structure first, then implement a fuller one-page branded experience with static product preview and clean CTA hierarchy, while preserving auto-resume behavior and de-emphasizing internal founder access.
