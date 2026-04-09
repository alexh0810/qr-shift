<!-- GSD:project-start source:PROJECT.md -->
## Project

**QRShift**

QRShift is a simple, QR-based time tracking tool for small businesses to replace paper timesheets and generate payroll-ready reports. Employees clock in and out by scanning a QR code with no app installs or logins, while managers monitor shifts and export clean attendance data. The next release focuses on turning the current demo into a sharper product experience through a public landing page and a more unified, recognizable QRShift visual identity.

**Core Value:** Clock in with a QR code. No apps. No logins. Payroll-ready in seconds.

### Constraints

- **Tech stack**: Stay within the existing Next.js and Firebase architecture — keep the demo maintainable for a solo builder
- **Cost**: Keep hosting and implementation simple — avoid adding separate marketing infrastructure or heavyweight services
- **Product scope**: Every feature must directly strengthen clock in/out speed, shift visibility, or payroll clarity — prevents overbuilding
- **Delivery priority**: Demo polish comes before pilot-hardening — the next release should improve trust, clarity, and presentation first
- **Platform**: Keep the experience browser-based and mobile-friendly — no native apps in this release
- **Content**: Landing page lives inside the same app and uses simple conversion paths — Calendly for demo booking and `mailto:` for contact
- **Language**: English only — no localization work in this milestone
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Runtime
- Next.js 14 App Router application running on React 18 and TypeScript.
- Node.js 18+ is the practical baseline because CI uses Node 18.
- Package management is npm-based with a standard `package-lock.json`.
## Core Frameworks
- `next` powers routing, bundling, metadata, and production builds.
- `react` and `react-dom` drive a client-rendered UI-first application.
- TypeScript strict mode is enabled with the `@/*` path alias.
## UI and Styling
- Tailwind CSS 3 is the primary styling layer.
- Global theming is handled with CSS variables and `next-themes`.
- Icons come from `lucide-react`.
- Fonts are loaded through `next/font`.
## Product Libraries
- `firebase` provides the browser SDK for Firestore access.
- `date-fns` is used for date formatting and time display.
- `qrcode.react` renders QR codes for store access flows.
- `nanoid` is used for lightweight token generation.
## Build and Developer Tooling
- Main scripts are `next dev`, `next build`, `next start`, `next lint`, and a custom `npm test`.
- ESLint uses Next.js defaults.
- PostCSS is present for Tailwind processing.
- CI currently installs dependencies, runs lint, and runs tests.
## Testing Tooling
- The repo has a custom Node-based test entry rather than Jest or Vitest.
- Payroll tests run through `sucrase-node`, which currently works through a transitive dependency rather than an explicit direct dependency.
## Deployment Assumptions
- The project is structured to deploy cleanly on Vercel or another generic Next.js host.
- No Dockerfile, `vercel.json`, Firebase Hosting config, or server runtime layer is included.
- The app is not built for static export because it depends on live Firestore reads.
## Environment Variables
- The runtime depends on browser-safe Firebase config variables:
## Current Stack Notes
- The application is heavily client-driven. There are no API routes, server actions, or backend-only services in the repo.
- That keeps the demo simple, but it means data validation, access control, and scaling protections are mostly outside the app code today.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

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
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## High-Level Shape
- This is a client-first Next.js App Router application.
- Most user flows are implemented as `"use client"` pages that fetch Firestore data directly from the browser.
- There is no server-side application layer in the repo for attendance writes, report generation, or manager authorization.
## Main Application Flow
- `/`
- `/admin/create-store`
- `/scan/[qr_token]`
- `/dashboard/[qr_token]`
- `/reports/[qr_token]`
## Data Boundaries
- `src/lib/firebase.ts`
- `src/lib/db.ts`
- `src/features/reports/data-processing.ts`
- `src/lib/time-calculation.ts` and `src/lib/report-utils.ts`
## State Management
- Local React state is the main state management model.
- Page-level `useEffect` hooks handle data loading and subscriptions.
- Persistent client state uses `localStorage` for convenience flows such as unlocking and session resume.
- There is no centralized store such as Zustand, Redux, or React Query.
## Report Module Design
- Reports are the most modular slice of the codebase.
- The page component acts mainly as an orchestrator.
- Data shaping, export generation, and UI rendering are split across feature-level modules.
- Inline timesheet corrections currently recalculate locally in memory and affect exports immediately.
## Architectural Strengths
- The app is straightforward to reason about because routes map directly to product flows.
- Report calculations are mostly isolated into pure functions, which improves testability.
- The feature split under `src/features/reports` gives a good foundation for future iterations.
## Architectural Tradeoffs
- Security-sensitive behavior happens on the client, including manager PIN checks and attendance writes.
- Dashboard still mixes direct Firestore listeners with shared library access instead of using one clean data access layer everywhere.
- Timelog status is derived repeatedly from history rather than maintained through a purpose-built query model.
- Local-only report correction state improves demo speed, but it is not an auditable source of truth.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
