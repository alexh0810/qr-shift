# QRShift

QRShift is a browser-based time clock for small businesses. Employees clock in and out by scanning a store QR code with their phone, no app or login needed. Managers see live shifts and export payroll-ready timesheets.

## Repository layout

| Path | Contents |
| --- | --- |
| `web/` | Next.js 14 client (App Router, React 18, Tailwind CSS) |
| `api/` | Fastify REST API (Node 22, TypeScript) |
| `docs/` | Architecture, API reference, decisions, operations |

## Quick start

Requirements: Node 22+, npm 10+, a Firebase project with Authentication enabled (Email/Password and Google).

```bash
npm install
npm run dev -w api   # API on :8080 (needs `DATABASE_URL`, `APP_ORIGIN`, see operations)
npm run dev          # web on http://localhost:3000, forwards /api/* to :8080
```

The web app reads `web/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_DEMO_BOOKING_URL=
NEXT_PUBLIC_CONTACT_EMAIL=
```

| Command | Runs |
| --- | --- |
| `npm run dev` | Web dev server |
| `npm run dev -w api` | API dev server on :8080 (needs `DATABASE_URL`, `APP_ORIGIN`, see [operations](docs/operations.md)) |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Type-check workspaces that define it |
| `npm test` | Unit tests in all workspaces |
| `npm run build` | Production builds |
| `npm run test:e2e -w web` | Playwright end-to-end tests |

## How it works

- **Clock in/out:** each store has a unique QR code. Employees scan it, pick their name, and the scan page decides whether the next action is `IN` or `OUT`.
- **QR modes:** owners choose per store. *Printed* (default): a fixed QR on paper; each clock-in is flagged `inside` / `outside` / `unknown` against the store's location, and reports show a warning and a CSV `Location` column. *Display*: a tablet in the store shows a QR that rotates every 30 s (`/display/[storeId]`); a scan is valid for 60 s, so clocking in needs someone to see the screen. Owners manage the mode, location, display link and QR reissue in `/admin`.
- **Dashboard and reports:** managers open `/dashboard/[qr_token]` or `/reports/[qr_token]`. Managers and owners sign in with an email/password or Google account (the sign-in form appears inline); access is per store (`owner` or `manager`). Reports give per-employee and all-staff totals in decimal hours, with CSV export.
- **Demo data:** the owner console at `/admin` (any signed-in user can create a store and becomes its owner) creates demo stores with realistic fake timelogs for walkthroughs.

## Configuration notes

- **Landing page CTAs:** `web/src/lib/site-config.ts` reads `NEXT_PUBLIC_DEMO_BOOKING_URL` (Calendly "Request a Demo") and `NEXT_PUBLIC_CONTACT_EMAIL` (`mailto:` contact link).

## Known limits

- **Display mode:** a screenshot of the QR forwarded off-site works for up to 60 s.
- **Both modes:** neither mode stops in-store buddy-punching (a coworker picking an absent colleague's name). They stop remote clock-ins.
- **Printed mode:** the printed QR can be photographed and reused, which is why every clock-in is location-flagged. The flag is advisory and never blocks: location comes from the phone's browser and can be spoofed, denied or inaccurate, and a store without coordinates records nothing.
- **Display tablet:** needs power, a connection and a screen that stays awake; a leaked display link can show the QR from anywhere until the owner resets it.
- **Reissue:** reissuing the QR affects display mode only; printed QR codes keep working.
- **Roster visibility:** the employee list is readable with the store's QR token; only clocking is gated.

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Decisions](docs/decisions.md)
- [Operations](docs/operations.md)

## License

MIT
