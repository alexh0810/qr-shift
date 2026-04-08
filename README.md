# QRShift

QRShift is a mobile-first QR-based staff attendance system for small businesses. Employees scan a store QR code to clock in and out without a login, while managers monitor live shift status and generate payroll-ready reports with decimal-hour totals.

## Description

QRShift is designed for quick demo use and lightweight business operations:

- Employees use a QR code to access a scan page and record attendance.
- Managers unlock a dashboard with a PIN to monitor current shift status.
- Reports provide payroll-ready totals, per-shift breakdowns, employee filtering, and CSV export.

## Features

- QR-based clock in/out with no employee login required
- Real-time shift dashboard for managers
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

Create `.env.local` with your Firebase web app configuration:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

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
2. A manager PIN unlocks access.
3. The dashboard shows live attendance status.
4. Reports provide employee-level and all-staff payroll summaries with CSV export.

### Demo Flow

Use the admin page to create a demo store with realistic fake timelog data for customer demos and report testing.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
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
