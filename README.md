# QRShift

QRShift is a mobile-first QR-based staff attendance system for small businesses. Employees scan a store QR code to clock in and out without a login, while managers monitor live shift status and generate payroll-ready reports with decimal-hour totals.

## Description

QRShift is designed for quick demo use and lightweight business operations:

- Employees use a QR code to access a scan page and record attendance.
- Managers unlock a dashboard with a PIN to monitor current shift status.
- Reports provide payroll-ready totals, per-shift breakdowns, employee filtering, and CSV export.

## Features

- QR-based clock in/out with no employee login required
- Protected manager dashboard with a server-issued store session
- Payroll-ready reporting with decimal hours and timesheet rows
- Employee filtering and detailed timesheet views
- CSV export for summary and payroll workflows
- Demo data generation for private product demos

## Tech Stack

- Next.js (App Router)
- Firebase / Firestore
- TypeScript
- Tailwind CSS
- date-fns

## Project Structure

```text
src/
  app/
    admin/        Admin onboarding and demo store creation
    dashboard/    Live manager dashboard
    reports/      Payroll-ready reporting screens
    scan/         Employee QR scan flow
  components/     Shared UI wrappers and compatibility exports
  features/
    reports/      Report types, processing, export logic, and UI components
  lib/            Shared data access, time helpers, and demo data builders
  types/          App-wide TypeScript domain types
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Firebase project with Firestore enabled

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local` with your Firebase web app configuration, manager/admin session secrets, and Firebase Admin credentials:

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

You can copy these keys from [.env.example](/Users/alex/.codex/worktrees/902b/QRShift/.env.example).

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Employee Clock In / Clock Out

1. A manager creates a store and employee list.
2. The system generates a unique QR code for that store.
3. Employees scan the QR code and select their name.
4. The scan page determines whether the next action is `IN` or `OUT`.

### Manager Dashboard and Reports

1. Managers open the dashboard or reports URL using the store QR token.
2. A manager PIN is validated by a trusted server route and creates a 7-day `HttpOnly` store session.
3. The dashboard refreshes a protected attendance snapshot on load and at a lightweight polling interval.
4. Reports provide employee-level and all-staff payroll summaries with CSV export.

### Demo Flow

Use the admin page to create a demo store with realistic fake timelog data for customer demos and report testing. The route is now owner-protected by a server-issued session.

### Manual PIN Migration

Existing plaintext manager PINs must be migrated before rollout:

```bash
npm run migrate:pins
```

This script hashes `stores.pin` into `stores.pin_hash` and removes the plaintext field.

### Landing Page CTAs

The landing page reads its public action targets from [site-config.ts](/Users/alex/.codex/worktrees/902b/QRShift/src/lib/site-config.ts:1):

- `NEXT_PUBLIC_DEMO_BOOKING_URL` powers the public Calendly `Request a Demo` action
- `NEXT_PUBLIC_CONTACT_EMAIL` powers the public `Contact` mailto link

The homepage should treat `Request a Demo` and `Contact` as customer-facing actions and explain the product directly through the page itself rather than exposing internal demo access.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run migrate:pins
```

## Roadmap

- Authentication and role-based access
- Payroll integrations
- Expanded admin management tools
- Mobile app or installable PWA enhancements
- Persistent report corrections workflow

## Demo Release Notes

This repository is prepared for a private `v1.0-demo` release:

- report logic is modularized for easier iteration
- demo seed data supports customer walkthroughs
- CI validates linting and test execution on pushes and pull requests

## License

MIT
