# QRShift

QRShift is a browser-based time clock for small businesses. Employees clock in and out by scanning a store QR code with their phone, no app or login needed. Managers see live shifts and export payroll-ready timesheets.

## Repository layout

| Path | Contents |
| --- | --- |
| `web/` | Next.js 14 client (App Router, React 18, Tailwind CSS) |
| `docs/` | Architecture, API reference, decisions, operations |

## Quick start

Requirements: Node 22+, npm 10+, a Firebase project with Firestore enabled.

```bash
npm install
npm run dev     # http://localhost:3000
```

The web app reads `web/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_DEMO_BOOKING_URL=
NEXT_PUBLIC_CONTACT_EMAIL=
MANAGER_SESSION_SECRET=
OWNER_SETUP_SECRET=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

| Command | Runs |
| --- | --- |
| `npm run dev` | Web dev server |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Type-check workspaces that define it |
| `npm test` | Unit tests in all workspaces |
| `npm run build` | Production builds |
| `npm run test:e2e -w web` | Playwright end-to-end tests |
| `npm run migrate:pins -w web` | Hash legacy plaintext manager PINs (see below) |

## How it works

- **Clock in/out:** each store has a unique QR code. Employees scan it, pick their name, and the scan page decides whether the next action is `IN` or `OUT`.
- **Dashboard and reports:** managers open `/dashboard/[qr_token]` or `/reports/[qr_token]`. A manager PIN is checked by a server route, which sets a 7-day `HttpOnly` store session. Reports give per-employee and all-staff totals in decimal hours, with CSV export.
- **Demo data:** the owner-protected `/admin` page creates demo stores with realistic fake timelogs for walkthroughs.

## Configuration notes

- **Landing page CTAs:** `web/src/lib/site-config.ts` reads `NEXT_PUBLIC_DEMO_BOOKING_URL` (Calendly "Request a Demo") and `NEXT_PUBLIC_CONTACT_EMAIL` (`mailto:` contact link).
- **PIN migration:** stores with a plaintext `stores.pin` must be migrated before rollout. `npm run migrate:pins -w web` writes `stores.pin_hash` and removes the plaintext field.

## Documentation

- [Architecture](docs/architecture.md)
- [Decisions](docs/decisions.md)

## License

MIT
