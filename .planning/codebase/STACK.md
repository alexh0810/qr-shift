# Stack

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
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

## Current Stack Notes

- The application is heavily client-driven. There are no API routes, server actions, or backend-only services in the repo.
- That keeps the demo simple, but it means data validation, access control, and scaling protections are mostly outside the app code today.
