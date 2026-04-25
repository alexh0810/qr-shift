---
phase: 02
slug: landing-page
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-09
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for frontend phases. Generated for the QRShift landing page and aligned to the Phase 1 brand foundation.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | `lucide-react` |
| Font | `Space Grotesk` for display, `Geist` for body/UI, `Geist Mono` for operational numeric accents only |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon nudge, badge icon spacing |
| sm | 8px | Tight inline gaps, compact chip padding |
| md | 16px | Default element spacing, small card padding |
| lg | 24px | Section internals, card gutters |
| xl | 32px | Major card padding, stacked layout gaps |
| 2xl | 48px | Desktop section spacing, hero interior rhythm |
| 3xl | 64px | Page-level vertical separation between major narrative sections |

Exceptions: `36px` corner radii and existing semantic radius tokens are allowed for major hero and panel surfaces only.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 500 | 1.65 |
| Label | 12px | 600 | 1.4 |
| Heading | 32px | 700 | 1.1 |
| Display | 56px desktop / 42px mobile | 700 | 0.95-1.0 |

Rules:
- Display typography is reserved for hero headline and select section-leading moments only.
- Section headings stay bold and crisp, but must remain more restrained than the hero.
- Body copy should stay operational and scannable, not airy editorial prose.
- Uppercase micro-labels may be used for section signposts, with high letter-spacing only in short doses.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#f4f7fb` / dark `#08101f` | Page background, overall canvas, spacious content field |
| Secondary (30%) | `#edf2ff` / dark `#0e1930` | Elevated backgrounds, hero side glow, supporting panels |
| Accent (10%) | `#245cff` primary, `#1ed7b5` secondary signal | Primary CTA, key badges, hero emphasis, select icons, QR motif accents |
| Destructive | `#ff6b47` | Error and destructive states only |

Accent reserved for: primary CTA, hero highlight treatments, section badges, QR-inspired visual motifs, and one supporting accent per section. Accent must not be used for every interactive element.

---

## Layout and Narrative Contract

- The page remains a single scrollable route at `/`.
- Section order is locked:
  1. Hero
  2. How it works
  3. Core benefits
  4. Best-fit businesses
  5. CTA close
- Internal founder/admin access may exist on the page, but only as a secondary utility action or lower-priority block.
- The hero must feel like a bold product brand moment, not a plain brochure header.
- The page should include a static UI preview that makes the product feel real and ready, not conceptual.
- Mobile clarity is non-negotiable: stacked sections, clean CTA grouping, and readable content density are required.

---

## Surface Contract

- Major surfaces should feel crisp and structured, using the Phase 1 radii and border language rather than soft consumer-card styling.
- Hero section should combine:
  - one dominant message block
  - one product preview or visual proof block
  - restrained QR geometry or grid cues
- Supporting sections should alternate between direct explanation and visual relief so the page does not feel like one long wall of cards.
- Product preview should look like a believable QRShift interface frame, not a generic SaaS browser mockup.
- Shadows should remain controlled and architectural, not soft or dreamy.

---

## Component Behavior Contract

- Primary CTA: solid accent fill, highest visual emphasis, appears in hero and closing CTA section.
- Secondary public CTA: bordered or lower-emphasis button, paired with primary CTA.
- Internal demo/admin CTA: tertiary treatment only.
- Badges and micro-labels should help scan the page, not become decoration.
- Icons should support comprehension; avoid using them as purely ornamental fillers.
- Any motion should be light, meaningful, and limited to reveal/hover polish. No busy looping animations.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Request a Demo` |
| Empty state heading | `No page section content available yet.` |
| Empty state body | `Add the agreed landing-page sections in order: hero, how it works, benefits, best-fit businesses, and CTA close.` |
| Error state | `Something blocked the landing page from loading. Refresh the page or use the direct demo/admin path if you need immediate access.` |
| Destructive confirmation | `Not applicable in this phase` |

Copy rules:
- Headline and subheadline must explain QRShift within seconds, but still feel brand-forward.
- Language should stay simple, operational, and specific to small businesses with hourly staff.
- Avoid generic startup clichés like "streamline your workforce" or "transform operations."
- Best-fit customer language should feel practical and concrete.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none | not required |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-09
