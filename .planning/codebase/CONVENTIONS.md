# Conventions

## Naming

- React component files use PascalCase.
- Utility and helper files usually use kebab-case.
- Functions and variables use camelCase.
- Firestore document fields use snake_case to match stored data.
- Route segment folders follow Next.js App Router conventions.

## TypeScript and Imports

- TypeScript strict mode is enabled.
- The repo uses the `@/` alias for imports from `src/`.
- Types are mostly explicit around report processing and Firestore entities.

## Component Style

- Route pages tend to own their loading and error state directly.
- Reusable UI is extracted when a flow becomes more complex, as seen in `src/features/reports/components`.
- Components generally favor direct props over heavier abstraction layers.

## Data and Validation Style

- Guard clauses are used heavily for empty data and invalid states.
- Input validation is lightweight and mostly handled through UI constraints and simple runtime checks.
- There is no centralized schema validation layer such as Zod.

## Error Handling Style

- UI flows generally fail softly with inline messages rather than throwing.
- Data helpers often return `null`, empty arrays, or fallback values when records are missing.
- Some timestamp parsing paths fall back to `new Date()` behavior, which can mask malformed data in edge cases.

## Styling Conventions

- Tailwind utility classes are the main styling approach.
- Shared color and theme tokens are expressed through CSS variables.
- The app favors clean mobile-first layouts over dense desktop-first patterns.

## Maintainability Patterns

- Pure calculation logic has been extracted for reports and payroll math.
- Compatibility facades are used to avoid breaking older imports during refactors.
- The strongest modularity is in the reports feature set.

## Known Convention Gaps

- There is no formatter configuration committed, so code style consistency relies on editor defaults and existing patterns.
- Security-sensitive decisions are still embedded in UI flows, especially around manager access and scan behavior.
