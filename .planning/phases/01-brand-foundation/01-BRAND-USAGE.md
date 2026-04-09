# QRShift Brand Usage

## Reuse Rules

- Use `.font-display` for hero headlines, major section titles, and deliberate brand statements only.
- Use the default body font or `.font-body` for operational copy, controls, labels, and dense reading.
- Use the semantic token layer in `src/app/globals.css` rather than introducing one-off route colors.
- Apply QR motifs as accents, frames, or section structure. Do not use them as a busy layer behind dense content.
- Keep component geometry crisp and structured with restrained radii, visible borders, and clear layout rhythm.

## Landing Page Guidance

- Push the brand harder on the landing page than on work-critical screens.
- Lead with large display typography, strong contrast, and selective QR-grid or modular square motifs.
- Keep CTA treatment direct and high-confidence, with one dominant action and one supporting action.
- Use the root proof surface as the starting point, then expand into a fuller landing narrative in the next phase.

## Product Surface Guidance

- Scan, dashboard, and reports should adopt the new system through shared primitives and token reuse rather than route-specific one-off styling.
- Keep the display font limited in product screens. Operational readability comes first.
- Favor structured containers, stronger outlines, and calmer backgrounds in the product than on the marketing surface.
- Use accent colors to emphasize key status, actions, and totals, not every decorative element.

## Accessibility Checks

- Verify text/background contrast in both light and dark themes.
- Check that headline scale remains readable on mobile without wrapping into awkward fragments.
- Confirm motifs do not interfere with tables, forms, or attendance actions.
- Keep touch targets comfortable on small screens.

## Migration Notes

- Existing routes still depend on `background`, `foreground`, `surface`, and `surfacestroke` Tailwind aliases; those now map to the semantic token layer and should continue to be reused until route-level cleanup happens.
- Future refactors should prefer semantic token usage and shared utilities over custom route palettes.
- The proof surface on `/` and the `BrandMark` component are reference implementations for later phases, not one-off experiments.
