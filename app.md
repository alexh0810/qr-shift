# QRShift App Guide

This document is a codebase-grounded guide to QRShift as of 2026-04-27. It is written for interview prep: the goal is to help you explain what the app does, how it is built, why certain decisions were made, and where the main tradeoffs live.

## 1. What QRShift Is

QRShift is a browser-based time tracking app for small businesses. The core loop is intentionally simple:

1. A store has one QR code.
2. Employees scan it and choose their name.
3. The system records `IN` and `OUT` timelogs.
4. Managers unlock a dashboard and reports view with a PIN.
5. Reports turn raw timelogs into payroll-friendly totals and CSV exports.

The product is deliberately optimized for speed, demo-readiness, and solo-builder maintainability rather than enterprise-grade controls. That explains many of the codebase choices.

## 2. Product Stage And Intent

QRShift is not trying to be a full workforce platform yet. The current milestone is polishing the demo into a stronger product presentation:

- Public landing page inside the same Next.js app
- Sharper QRShift visual identity across product screens
- Better manager-facing polish without changing the core attendance model

That framing matters for interviews because many tradeoffs are intentional:

- It favors a boring, fast stack over sophistication.
- It accepts demo-grade security in some flows.
- It invests most in the business-critical loop: clocking, visibility, and payroll export.

## 3. Stack In One View

## Frontend

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- `lucide-react` for icons
- `next/font` for typography

## Backend And Data

- Firebase client SDK for browser-safe app config
- Firebase Admin SDK for privileged server reads and writes
- Firestore as the only database

## Utilities

- `date-fns` for date formatting and range logic
- `qrcode.react` for QR image rendering
- `nanoid` for QR token generation

## Testing

- Custom Node test runner via `sucrase-node`
- Playwright for one end-to-end browser flow

## 4. The Main Product Surfaces

The app has four real product surfaces and one supporting marketing surface.

## `/`

This is the landing page, not the employee scanner. It explains the product, shows branded previews, and routes visitors to public CTAs configured through `src/lib/site-config.ts`.

Key idea:
- The marketing site lives inside the same app to keep infrastructure simple and avoid a separate CMS or site deployment.

## `/scan/[qr_token]`

This is the employee clock station. It is intentionally lightweight:

- loads store and employee roster
- derives each employee's latest status
- lets the user pick a name
- computes the next expected action (`IN` or `OUT`)
- submits a clock event

This route is public by design. Anyone with the QR URL can access it.

## `/dashboard/[qr_token]`

This is the manager live status view. It is protected by a manager PIN flow that creates an `HttpOnly` session cookie. Once unlocked, it polls the server for a fresh dashboard snapshot every minute.

## `/reports/[qr_token]`

This is the payroll-facing reporting workspace. It:

- loads employees and timelogs for the store
- filters to a selected date range
- computes shift rows and summary totals
- lets managers edit times
- exports CSV

This is the most mature and modular part of the app.

## `/admin`

This is an internal setup screen for creating stores and seeding demo data. It is protected by an owner secret and owner session cookie.

## 5. Data Model

The domain model is intentionally tiny. Most behavior comes from deriving meaning out of timelog history rather than storing a richer workflow model.

## `Store`

Defined in `src/types/index.ts`.

Fields:

- `id`
- `name`
- `qr_token`
- `created_at`
- legacy `pin`
- current `pin_hash`

Important detail:
- the app still carries legacy support for plaintext store PINs because there is a migration script to hash older data.

## `Employee`

Fields:

- `id`
- `name`
- `store_id`
- `created_at`

## `Timelog`

Fields:

- `id`
- `employee_id`
- `store_id`
- `type` as `IN` or `OUT`
- `timestamp`

This is the core event stream. There is no separate Shift table. Shifts are reconstructed by pairing `IN` and `OUT` events in chronological order.

## 6. Architecture At A Glance

QRShift is a mixed client/server Next.js app, but the frontend remains mostly client-driven.

## UI Layer

The route pages under `src/app/` are mostly `"use client"` pages. They own loading, error, and interaction state directly.

Examples:

- `src/app/scan/[qr_token]/page.tsx`
- `src/app/dashboard/[qr_token]/page.tsx`
- `src/app/reports/[qr_token]/page.tsx`
- `src/app/admin/page.tsx`

This is simple to reason about, but it means the app does not yet lean heavily on React Server Components for data loading.

## Browser API Wrapper

`src/lib/client-api.ts` is the client-side gateway to the internal API routes.

Its job is to:

- call internal routes with `fetch`
- normalize errors
- deserialize ISO strings back into `Date` objects

This is a good small abstraction. It keeps pages from duplicating request and parsing logic.

## Route Handler Layer

Internal API routes live under `src/app/api/**`.

Examples:

- `api/stores/[qr_token]`
- `api/stores/[qr_token]/employees`
- `api/stores/[qr_token]/clock`
- `api/manager/session`
- `api/manager/[qr_token]/dashboard`
- `api/manager/[qr_token]/reports`
- `api/admin/session`
- `api/admin/stores`
- `api/admin/demo-store`

These routes are deliberately thin. Most of them delegate into `src/lib/route-workflow-helpers.ts` and `src/lib/server-db.ts`.

## Server Domain Layer

`src/lib/server-db.ts` is the real backend core. It handles:

- Firestore reads and writes
- store lookup by QR token
- employee and timelog loading
- roster derivation
- dashboard snapshot derivation
- report snapshot loading
- transactional clock actions
- transactional report corrections
- store creation
- demo store seeding

This file is effectively the service layer of the app.

## Auth And Session Layer

`src/lib/server-auth.ts` owns signed cookie sessions for:

- managers
- owners

Sessions are HMAC-signed payloads, scoped to a seven-day lifetime, and set as `HttpOnly` cookies. This is more secure than storing auth state in `localStorage`, but it is still a lightweight custom auth pattern rather than a full user system.

## 7. The Most Important Runtime Flows

## A. Employee Clock In / Clock Out

Flow:

1. `scan/[qr_token]` loads roster from `/api/stores/[qr_token]/employees`
2. The API uses `getScanRosterByQrToken`
3. `server-db` loads the store, employees, and all store timelogs
4. It derives each employee's latest state by taking the latest timelog per employee
5. The UI chooses the next action based on the latest log
6. A POST to `/api/stores/[qr_token]/clock` records the action
7. `createClockActionWithDb` runs inside a Firestore transaction
8. The transaction recomputes the expected action and rejects stale transitions

Why this is good:

- the write path has a real concurrency check
- the UI is simple
- the product logic matches the mental model of a paper sign-in sheet

Tradeoff:

- reads are not cheap because status is derived from whole timelog history rather than a current-shift index

## B. Manager Unlock

Flow:

1. `PinGuard` loads the store and current manager session
2. user submits PIN
3. `/api/manager/session` verifies the PIN hash against the store
4. the server sets a signed cookie
5. dashboard and reports routes then call protected APIs

Why this decision makes sense:

- it removes raw PIN comparison from the client
- it avoids introducing full authentication infrastructure
- it is enough for a private demo product

Tradeoff:

- it is still PIN-based access with one shared manager identity per store, not user-level auth

## C. Dashboard Snapshot

Flow:

1. dashboard page polls `/api/manager/[qr_token]/dashboard`
2. route checks manager session authorization
3. backend reuses scan-roster derivation logic
4. UI splits employees into `IN` and `OUT` buckets

Why this is pragmatic:

- one simple snapshot endpoint
- no websocket layer
- easy to reason about and test

Tradeoff:

- polling every minute is fine for demo scale, but not ideal for richer realtime expectations

## D. Reports And Payroll Export

Flow:

1. reports page loads store, employees, and all timelogs for the store
2. `buildReportData` groups logs by employee and reconstructs shifts
3. shifts are turned into:
   - daily summaries
   - editable timesheet rows
   - global totals
4. CSV export is built entirely client-side

This is the cleanest product module in the app because most of the logic is pure and testable.

## 8. Why The Reports Module Is The Strongest Slice

The reports feature is where the codebase shows the best engineering judgment.

## Pure Computation First

`src/features/reports/data-processing.ts` turns raw logs into business outputs without being tied to React. That makes it:

- easy to test
- easy to reason about
- easier to refactor than UI-heavy logic

## Clear Handling Of Imperfect Data

The report engine explicitly handles missing clock-outs:

- same-day open shifts are treated as ongoing
- past-day open shifts are auto-closed at midnight

That is exactly the kind of product rule an interviewer may ask about, because it is both a UX choice and a payroll decision.

## Local Draft Strategy For Same-Day Edits

One of the most interesting decisions in the app is in `src/features/reports/drafts.ts`.

If a manager edits the end time of a same-day ongoing shift:

- the change is stored locally in `localStorage`
- it is not written back to Firestore immediately
- once a real `OUT` timelog exists or the day rolls over, the draft is pruned

Why this exists:

- the business wants planning flexibility for today's payroll view
- the live attendance model should still reflect real scans
- the team avoided writing fake future `OUT` events into the source of truth

Why this is a good interview talking point:

- it shows a nuanced distinction between "operator convenience" and "auditable system state"
- it is a strong example of choosing a lightweight compromise instead of overbuilding

## 9. Key Engineering Decisions And Why They Were Made

## Decision 1: Keep Everything In One Next.js App

Why:

- lowest operational cost
- simplest deploy story
- marketing and product can share branding primitives

Outcome:

- the landing page, admin tools, scanner, dashboard, and reports all live together

Tradeoff:

- route concerns are mixed inside one project
- there is no clean separation between customer-facing and internal surfaces

## Decision 2: Use Firestore As Both Database And Event Log

Why:

- fast to ship
- fits a solo-builder workflow
- works well for append-oriented `IN` and `OUT` timelogs

Outcome:

- the data model stays tiny
- derived state can be rebuilt from logs

Tradeoff:

- many reads involve loading more history than ideal
- "current shift status" is computed repeatedly instead of stored explicitly

## Decision 3: Thin API Routes, Heavier Shared Service Layer

Why:

- easier unit testing
- avoids repeating input/serialization logic
- keeps Next route files small

Outcome:

- `route-workflow-helpers.ts` and `server-db.ts` carry most reusable logic

Tradeoff:

- `server-db.ts` is becoming a large central file and could eventually need submodules

## Decision 4: Custom Signed Cookies Instead Of Full Auth

Why:

- enough for a demo
- lower complexity than Firebase Auth or a third-party identity provider

Outcome:

- manager and owner gates are protected server-side
- the browser no longer needs direct access to privileged reads

Tradeoff:

- no user accounts
- no RBAC
- store-level shared access is not strong security

## Decision 5: Invest In Reusable Brand Primitives

Why:

- the milestone is product polish
- the demo needs to feel coherent for customer conversations

Outcome:

- shared tokens in `src/app/globals.css`
- shared QRShift brand components like `BrandMark`
- shared manager workspace primitives like `ManagerWorkspaceShell` and `WorkspacePanel`

Tradeoff:

- more UI structure than a raw MVP
- still not a full design system, but enough to keep the app visually consistent

## 10. The Main Tradeoffs And Risks

This is the most important section for interview honesty.

## Security Is Improved But Still Demo-Grade

Better than before:

- PINs are hashed with scrypt
- manager and owner access use server-issued cookies
- protected snapshots now go through internal API routes

Still weak:

- anyone with the QR URL can open the scan page
- anyone at the scan station can choose any employee name
- there is no true identity model
- repository-level Firestore rule protection is not visible here

This is acceptable only because the product is explicitly scoped as a demo-first small-business tool.

## Scalability Is Not Yet First-Class

Examples:

- roster derivation loads all store timelogs
- dashboard status is recomputed from history
- reports load full store timelog history for the selected store and filter in memory

This will strain as stores and history grow.

## The App Prefers Derived State Over Indexed State

That keeps the write model simple, but it pushes work into reads.

Good:

- fewer persisted concepts
- less write coordination

Bad:

- more repeated computation
- more opportunity for performance degradation

## Some Data Validation Is Intentionally Lightweight

The app uses guard clauses and simple runtime checks rather than a schema system like Zod.

Good:

- low ceremony
- fast iteration

Bad:

- weaker guarantees
- more room for inconsistent payload handling over time

## 11. Places Where The Codebase Shows Strong Judgment

These are good signals to call out in an interview.

## The API Boundary Got Cleaner

Earlier versions of this product appear to have leaned more heavily on client-side data access. The current code pushes privileged reads and writes behind app routes and a server-side helper layer.

That is a meaningful architectural improvement without a full rewrite.

## Route Logic Is Dependency-Friendly

`route-workflow-helpers.ts` takes dependencies as arguments. That makes route behavior testable without spinning up the whole app or mocking Firebase everywhere.

This is a subtle but very solid design choice.

## The Product Rules Are Explicit

The report engine names important states:

- `closed`
- `autoClosed`
- `ongoing`
- `managerOverride`

That makes product behavior easier to explain, test, and evolve.

## The Team Avoided Heavy Infrastructure

There is no queue, no separate API service, no external auth system, and no second marketing stack. For this stage, that is restraint, not lack of ambition.

## 12. Sharp Edges And Code Smells To Know

## `server-db.ts` Is Doing A Lot

It is the main service layer, but it now owns many responsibilities:

- mapping Firestore documents
- reads
- writes
- transaction logic
- store creation
- demo seeding

This is manageable today but is a natural future split point.

## `ensureDate()` Hides Bad Data

When a Firestore value is malformed, `ensureDate()` falls back to `new Date()`. That keeps the app resilient, but it can silently mask data issues.

## Some Docs Are Stale Relative To The Code

Examples visible in the repo:

- `README.md` references `.env.example`, but that file is not present
- `.planning/codebase/TESTING.md` says there is no end-to-end coverage and no build in CI, but the repo now has a Playwright flow and CI runs `npm run build`

That is not catastrophic, but it is a sign that documentation trails implementation.

## The Reporting Options API Is Slightly Ahead Of Its Current Behavior

`ReportCalculationOptions` includes `missingOutStrategy`, but the current implementation effectively uses fixed behavior:

- same-day open shifts use current time
- past-day open shifts auto-close at midnight

So the type surface is a bit more flexible than the real engine right now.

## 13. Testing Story

The testing story is better than the older planning docs suggest.

## Unit And Logic Tests

The custom test runner imports:

- payroll/report logic tests
- report draft tests
- CSV export tests
- route helper tests
- security tests
- `server-db` tests with a fake Firestore implementation

This is a strong fit for the shape of the app because the most important business rules are pure or near-pure.

## End-To-End Coverage

There is one Playwright flow in `tests/e2e/scan-dashboard-reports.spec.ts` that verifies:

- scan page can clock in
- manager can unlock dashboard
- dashboard shows current status
- reports page loads
- CSV export works

Important nuance:

- the E2E test mocks the app's internal APIs rather than hitting real Firebase

That makes the test fast and stable, but it is more of a full UI contract test than a real production environment test.

## CI

CI currently runs:

- `npm ci`
- `npm run lint`
- `npm test`
- `npm run build`

That is a good lightweight baseline for a solo-builder repo.

## 14. How To Read The Codebase Efficiently

If you need to re-open this repo quickly before an interview, read it in this order:

1. `README.md`
2. `src/types/index.ts`
3. `src/lib/client-api.ts`
4. `src/lib/server-auth.ts`
5. `src/lib/server-db.ts`
6. `src/features/reports/data-processing.ts`
7. `src/features/reports/drafts.ts`
8. `src/app/scan/[qr_token]/page.tsx`
9. `src/app/dashboard/[qr_token]/page.tsx`
10. `src/app/reports/[qr_token]/page.tsx`
11. `tests/e2e/scan-dashboard-reports.spec.ts`

That path gives you the product model, the API shape, the security pattern, and the most valuable business logic.

## 15. Interview Framing: The 90-Second Story

If asked to summarize the app, a strong answer would sound like this:

"QRShift is a small-business attendance tool built around a very simple operational loop: one store QR code, no employee login, quick clock in/out, a manager dashboard, and payroll-ready reports. The codebase uses Next.js and Firebase because the product is intentionally optimized for solo-builder speed and low ops overhead. The most important technical decision is that raw timelogs are the source of truth, and dashboard status plus payroll reports are derived from those logs. The strongest engineering slice is the reporting engine because it turns messy real-world clock data into clean summaries with explicit rules for ongoing and missing clock-outs. The main tradeoff is that the product is demo-grade rather than enterprise-grade: security is improved through hashed PINs and signed cookies, but the scanner is still public and status derivation is not yet optimized for scale." 

## 16. Interview Questions You Should Expect

## Why Next.js + Firebase?

Best answer:

- fastest way to ship full-stack browser software as one person
- great fit for a CRUD-plus-derivation app
- low infrastructure overhead

## Why not use full authentication yet?

Best answer:

- the milestone is demo polish, not auth hardening
- shared PIN plus server-issued cookies is enough for the current product stage
- the team improved the boundary without paying for a full auth rewrite yet

## What would you fix first for production?

Strong first answers:

- move to real authentication and authorization
- make Firestore rules explicit and versioned
- reduce whole-history reads for dashboard and scan status
- add more integration coverage around protected flows and data access

## What part of the codebase would you show as your best engineering work?

Strong answer:

- the reports module, because it isolates business logic, handles imperfect operational data, and is covered by tests

## 17. AI-Native Builder Angle

This app does not have AI features, and that is actually part of the story.

A strong AI-native builder framing here is:

- choose the smallest architecture that solves the real user problem
- document decisions clearly
- isolate business logic into testable units
- use AI to accelerate understanding, refactoring, QA, and documentation
- do not add AI where it does not improve clock speed, shift visibility, or payroll clarity

In other words, the "AI-native" strength is not "add a chatbot." It is builder judgment:

- identify the actual bottleneck
- ship the simplest useful architecture
- keep the system legible enough that AI tooling can help you move faster

QRShift is a good example of that style because the product scope is disciplined and the codebase is compact enough to reason about.

## 18. Bottom Line

QRShift is a thoughtful demo-stage product:

- simple core domain
- pragmatic full-stack architecture
- strong reporting logic
- improved but intentionally lightweight security
- honest tradeoffs around scale and identity

If you present it well, the strongest story is not "this is perfect." The strongest story is:

- the team knew what mattered
- the code reflects product priorities
- the system is small enough to ship quickly
- the tradeoffs are visible, understandable, and fixable
