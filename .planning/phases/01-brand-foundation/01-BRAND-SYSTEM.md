# QRShift Brand System

## Brand Summary

QRShift should feel modern, bold, and operational. It is not a quiet premium brand and it is not a soft, generic SaaS dashboard. The visual system should communicate speed, clarity, and confidence while staying readable in practical attendance and reporting flows.

Core expression:

- fast
- structured
- electric
- recognizable
- work-ready

The brand must feel like a real product for customer demos, not an internal admin tool.

## Typography

### Font Roles

- Display headlines: `Space Grotesk`
- Body and UI text: `Geist`
- Operational numeric/code surfaces: `Geist Mono`

### Usage Rules

- `Space Grotesk` is reserved for high-visibility moments: hero headlines, section headers, numeric callouts, and strong product statements.
- `Geist` is the default for paragraphs, forms, table labels, controls, cards, and dense interface content.
- `Geist Mono` is used for PIN fields, times, numeric summaries, QR/store tokens, and any code-like operational display.

### Hierarchy

- H1 should feel assertive and compressed, with tight line-height and slightly negative tracking where appropriate.
- H2 and H3 can use the display font when they introduce a major section or branded callout.
- Small labels, table headings, and explanatory text should remain in the UI font for clarity.

### Guardrails

- Do not use the display font for dense tables or form-heavy product screens.
- Do not introduce a third decorative font.
- Do not let headline styling reduce readability on mobile.

## Color Tokens

The palette should feel electric and high-confidence without becoming loud for its own sake.

### Semantic Tokens

- `--color-bg-canvas`: app/page background
- `--color-bg-elevated`: raised section background
- `--color-surface`: primary card and panel surface
- `--color-text-primary`: main reading color
- `--color-text-muted`: secondary/supporting text
- `--color-accent-electric`: primary branded accent
- `--color-accent-signal`: secondary accent for energy, highlights, and contrast
- `--color-border-soft`: subtle outline
- `--color-border-strong`: structured outline for confident surfaces
- `--radius-panel`: default panel and card radius
- `--radius-control`: default control radius
- `--shadow-panel`: standard raised surface shadow

### Palette Intent

- `--color-accent-electric` should remain in the blue-electric family to preserve continuity with the current product.
- `--color-accent-signal` should introduce a second sharper highlight, leaning cyan, mint, or acid-lime rather than purple.
- Neutral backgrounds should stay warm-clean or cool-clean, but not sterile white.
- Dark mode should preserve the same energy while softening glare and keeping contrast legible.

### Accessibility Rules

- Accent colors must never be the only carrier of meaning.
- Text on accent surfaces must keep readable contrast.
- Muted text still needs to remain readable on mobile in daylight conditions.

## Surface Language

QRShift surfaces should be crisp and structured, not pillowy or overly rounded.

### Shape

- Panels and cards use restrained radii.
- Controls use smaller radii than marketing blocks.
- Strong edges and alignment matter more than decorative softness.

### Borders and Depth

- Structured borders are part of the identity, especially on cards, controls, stat blocks, and table wrappers.
- Shadows should support separation, not become the primary identity device.
- Borders should be clearer than in the current UI, especially on important surfaces.

### Layout Rhythm

- Prefer clear grid alignment and visual rhythm over floating, blob-like composition.
- Use spacing to create confidence and order.
- Repeating modules should feel deliberate and system-driven.

## QR Motifs

QR-inspired geometry should be structural, not literal decoration.

### Recommended Uses

- square-grid accents
- corner cuts or framed blocks
- modular badge backgrounds
- section dividers with QR geometry
- subtle pattern moments in hero or section backgrounds

### Avoid

- fake QR code patterns everywhere
- noisy decorative backgrounds behind dense UI
- playful sticker-like shapes that weaken the operational tone

### Motif Principle

The motif should remind users of scanning, modularity, and instant access. It should support the name `QRShift` without competing with the content.

## Motion

Motion should reinforce confidence and responsiveness.

### Motion Rules

- entrance animations should be quick, deliberate, and directional
- hover states should feel mechanical and precise rather than bouncy
- key CTA or stat emphasis can use subtle scale, wipe, or reveal effects
- dense operational screens should minimize flourish and prioritize clarity

### Motion Guardrails

- avoid floaty animations
- avoid excessive stagger on work-critical screens
- keep motion reduced and respectful in dark mode and compact mobile layouts

## Accessibility Guardrails

- Maintain strong contrast between text and background in both light and dark themes.
- Keep interactive target sizes comfortable on mobile.
- Preserve readable type scales in dense operational layouts.
- Ensure decorative motifs do not interfere with form controls, charts, tables, or attendance actions.
- Respect reduced-motion preferences if motion utilities are added later.

## Component Rules

### Buttons

- Primary buttons should feel strong, electric, and direct.
- Secondary buttons should remain structured with visible borders.
- Avoid overly soft pill buttons as the default control shape.

### Cards and Panels

- Cards should use clear outlines, restrained radius, and confident spacing.
- Important cards can use motif accents or branded edge treatments.
- Cards should not rely on blur-heavy or frosted-glass styling.

### Inputs

- Inputs should feel precise and operational.
- Borders, focus states, and text sizing must support quick scanning and data entry.
- Numeric or PIN inputs can lean on `Geist Mono` for clarity.

### Tables and Reporting Surfaces

- Use the UI font for readability.
- Reinforce structure through borders, row rhythm, and hierarchy rather than decorative backgrounds.
- Use brand accents sparingly for totals, key metrics, and focus states.

### Marketing Sections

- Marketing surfaces can push the display font and motif system harder than product screens.
- Even in marketing, the design should stay deliberate and structured rather than theatrical.
