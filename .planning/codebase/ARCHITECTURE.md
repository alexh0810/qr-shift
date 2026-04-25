# Architecture

## High-Level Shape

- This is a mixed Next.js App Router application with client-rendered route pages backed by route handlers.
- Public and manager pages are still implemented primarily as `"use client"` pages, but they now fetch through internal API routes rather than reading all privileged data directly from the browser.
- Attendance writes, manager snapshots, admin store setup, and session verification now flow through a small server-side layer under `src/app/api` plus `src/lib/server-*` helpers.

## Main Application Flow

- `/`
  - Public landing page with customer-facing product messaging and CTA links.
- `/admin/create-store`
  - Owner-only bootstrap flow that creates stores, employees, and optional demo data through admin APIs.
- `/scan/[qr_token]`
  - Employee attendance flow for clock in and clock out backed by scan roster and clock-action APIs.
- `/dashboard/[qr_token]`
  - Manager-facing live status view with a PIN guard and authenticated dashboard snapshot API.
- `/reports/[qr_token]`
  - Manager-facing reporting UI with payroll-style aggregation, CSV export, and report-correction persistence for completed shifts.

## Data Boundaries

- `src/lib/client-api.ts`
  - Centralizes browser fetch calls to App Router APIs and response parsing.
- `src/lib/firebase-admin.ts`
  - Initializes the server-side Firebase Admin app and Firestore client.
- `src/lib/server-db.ts`
  - Contains privileged Firestore reads and writes for admin, manager, and scan flows.
- `src/lib/server-auth.ts`
  - Manages signed owner and manager session cookies.
- `src/features/reports/data-processing.ts`
  - Holds the reporting transformation layer, including auto-closed, ongoing, and corrected shift semantics.
- `src/lib/time-calculation.ts` and `src/lib/report-utils.ts`
  - Provide pure helpers for formatting and aggregation support.

## State Management

- Local React state is the main state management model.
- Page-level `useEffect` hooks handle data loading and subscriptions.
- Persistent client state uses `localStorage` for convenience flows such as unlocking and session resume.
- There is no centralized store such as Zustand, Redux, or React Query.

## Report Module Design

- Reports are the most modular slice of the codebase.
- The page component acts mainly as an orchestrator.
- Data shaping, export generation, and UI rendering are split across feature-level modules.
- Completed-shift corrections persist through the manager reports API, while same-day future clock-out drafts stay device-local in `localStorage` so dashboard and scan status continue to reflect real timelogs.

## Architectural Strengths

- The app is straightforward to reason about because routes map directly to product flows.
- Report calculations are mostly isolated into pure functions, which improves testability.
- The feature split under `src/features/reports` gives a good foundation for future iterations.

## Architectural Tradeoffs

- Manager PIN entry still starts in the client UI, so the overall access model remains demo-scoped rather than production-grade auth.
- Dashboard still mixes direct Firestore listeners with shared library access instead of using one clean data access layer everywhere.
- Timelog status is derived repeatedly from history rather than maintained through a purpose-built query model.
- Same-device future report drafts improve payroll planning UX, but they are intentionally not a shared or auditable source of truth.
