# Structure

## Top Level

- `src/`
  - Main application source.
- `public/`
  - Static assets, icons, manifest, and service worker.
- `.github/workflows/`
  - CI configuration.
- `.planning/codebase/`
  - Codebase intelligence produced by mapping.

## Application Routes

- `src/app/`
  - App Router routes and shared layout.
- `src/app/layout.tsx`
  - Global metadata, providers, theme wiring, and service worker registration.
- `src/app/page.tsx`
  - Home screen and launch point for app flows.
- `src/app/admin/create-store/page.tsx`
  - Store creation and demo data generation.
- `src/app/scan/[qr_token]/page.tsx`
  - Clock in and clock out experience.
- `src/app/dashboard/[qr_token]/page.tsx`
  - Realtime manager dashboard.
- `src/app/reports/[qr_token]/page.tsx`
  - Reports page that orchestrates report loading, filtering, editing, and export.

## Shared Components

- `src/components/`
  - Reusable UI building blocks such as manager PIN protection and theme controls.

## Report Feature Area

- `src/features/reports/`
  - Report-specific domain code.
- `src/features/reports/components/`
  - UI pieces for employee selection, report tables, and summary sections.
- `src/features/reports/data-processing.ts`
  - Timesheet shaping and report aggregation.
- `src/features/reports/export.ts`
  - CSV generation for current report views.
- `src/features/reports/types.ts`
  - Shared report-focused TypeScript models.

## Shared Libraries

- `src/lib/firebase.ts`
  - Firebase bootstrap.
- `src/lib/db.ts`
  - Firestore access helpers.
- `src/lib/time-calculation.ts`
  - Pure time formatting and calculation utilities.
- `src/lib/report-utils.ts`
  - Reusable report helper logic.
- `src/lib/payroll.ts`
  - Compatibility facade around the newer report calculation modules.
- `src/lib/demoData.ts`
  - Fake/demo data generation for testing reports.

## Shared Types

- `src/types/`
  - App-wide entity types for stores, employees, and timelogs.

## Dependency Direction

- Route pages depend on feature components and shared libs.
- Feature modules depend on shared libs and shared types.
- Shared libs do not depend on route pages.
- Reports are the clearest example of this intended layering, while some older route code remains more tightly coupled to Firestore details.
