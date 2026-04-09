# Integrations

## Firebase / Firestore

- Firebase Web SDK is the main external integration.
- Firestore is used for all persisted application data.
- There is no Firebase Auth, Storage, Functions, or Admin SDK in the repository.

## Firestore Collections

- `stores`
  - Tracks store metadata including `name`, `qr_token`, `pin`, and `created_at`.
- `employees`
  - Tracks employee records with `name`, `store_id`, and `created_at`.
- `timelogs`
  - Tracks attendance events with `employee_id`, `store_id`, `type`, and `timestamp`.

## Access Patterns

- Store lookup is done by `qr_token`.
- Employees are queried by `store_id`.
- Latest employee status is inferred from timelog history rather than a dedicated status field.
- Dashboard uses a realtime `onSnapshot` listener over store timelogs.
- Reports fetch store timelogs and aggregate results client-side.
- Admin onboarding creates stores, employees, and optional demo data directly from the browser.

## Browser APIs

- `localStorage`
  - Used for dashboard token persistence, scan token persistence, and manager PIN session state.
- Service Worker APIs
  - Used to register a lightweight PWA service worker.
- `beforeinstallprompt`
  - Used to support app install prompts on supported browsers.
- Blob and object URL APIs
  - Used to generate CSV exports in the browser.
- Canvas and image APIs
  - Used to export QR visuals.
- `window.location`
  - Used for URL construction and simple reload/navigation flows.

## Product Integrations Not Present

- No embedded QR camera scanner.
- No payroll provider integration.
- No analytics or error monitoring.
- No push notifications or messaging.
- No emulator or local Firebase test harness committed in the repo.

## Operational Dependencies

- Correct Firestore rules are critical because the app performs privileged writes from the client.
- Live internet access is required for current realtime and reporting flows.

## Integration Risks

- Firestore read volume can grow quickly because multiple screens fetch full history and aggregate locally.
- The current PWA service worker is network-only, so install does not imply meaningful offline capability.
- The public manifest still uses `Shiftly` branding, which does not fully match the `QRShift` product naming elsewhere.
