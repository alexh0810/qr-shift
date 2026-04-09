# Architecture

## High-Level Shape

- This is a client-first Next.js App Router application.
- Most user flows are implemented as `"use client"` pages that fetch Firestore data directly from the browser.
- There is no server-side application layer in the repo for attendance writes, report generation, or manager authorization.

## Main Application Flow

- `/`
  - Entry page with navigation into admin, dashboard resume, and scan resume flows.
- `/admin/create-store`
  - Store bootstrap flow that creates a store, employees, and optional demo data.
- `/scan/[qr_token]`
  - Employee attendance flow for clock in and clock out.
- `/dashboard/[qr_token]`
  - Manager-facing realtime status view with a PIN guard.
- `/reports/[qr_token]`
  - Manager-facing reporting UI with payroll-style aggregation and CSV export.

## Data Boundaries

- `src/lib/firebase.ts`
  - Initializes Firebase and Firestore.
- `src/lib/db.ts`
  - Contains most Firestore reads and writes used across the app.
- `src/features/reports/data-processing.ts`
  - Holds the main reporting transformation layer.
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
