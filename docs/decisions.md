# Decisions

Each entry: context, options considered, decision, consequences.

## D1. npm workspaces monorepo

- **Context:** The API is being split out of the Next.js app, and both sides need the same domain types and payroll math.
- **Options:** separate repos; a monorepo tool (Turborepo, Nx); plain npm workspaces.
- **Decision:** plain npm workspaces (`web/`, `api/`, later `packages/core`).
- **Consequences:** one lockfile and one CI pipeline; shared code is a workspace import, not a published package. No build caching across workspaces.

## D2. Fastify API, tested with `app.inject()`

- **Context:** The course requires a separate back-end server; the existing handlers already isolate validation from data access.
- **Options:** keep Next.js route handlers; Express; Fastify.
- **Decision:** Fastify 5 in TypeScript (NodeNext ESM). Tests use `node:test` with `tsx` and Fastify's in-process `app.inject()`.
- **Consequences:** no HTTP server or port needed in tests; built output is plain JS run by `node`, so production has no TypeScript runtime.

## D3. PostgreSQL on Neon with Drizzle; PGlite for tests

- **Context:** The data is relational (stores → employees → timelogs) and reports aggregate across all three; Firestore has no joins or cross-document constraints.
- **Options:** keep Firestore; Cloud SQL; Supabase; Neon. ORM: Prisma; Drizzle; raw SQL.
- **Decision:** Neon (free tier, scales to zero) with Drizzle ORM and drizzle-kit migrations. Tests run the real migrations on PGlite, an in-memory Postgres.
- **Consequences:** foreign keys, unique constraints and transactions protect payroll data. Tests need no Docker or network. Firestore real-time listeners go away; the dashboard will poll.

## D4. Cloud Run, deployed from GitHub Actions with Workload Identity Federation

- **Context:** The API needs free hosting with fast cold starts, since clock-in must finish in under 10 seconds.
- **Options:** Render free tier (sleeps, ~30 s wake-up); Fly.io; Cloud Run.
- **Decision:** Cloud Run in `europe-west3`, `--max-instances 3`, deployed by CI. GitHub authenticates to GCP through Workload Identity Federation restricted to this repository.
- **Consequences:** cold starts of a few seconds; no long-lived cloud credentials in GitHub; requires a GCP billing account (budget alert at $1).

## D5. Smoke-tested deploys and expand/contract migrations

- **Context:** A merge to `main` deploys straight to production, and migrations run before the new code is live.
- **Options:** deploy and send traffic immediately; a manual approval gate; a full staging environment; deploy without traffic and promote after a smoke test.
- **Decision:** deploy each revision with no traffic, health-check its tagged URL, then promote. Migrations must stay compatible with the previous revision (expand first, contract in a later PR).
- **Consequences:** a broken build never takes traffic and rollback is rarely needed. No staging environment yet; revisit when production holds real data.

## D6. Same HTTP contract for ported routes; no shared core package yet

- **Context:** The legacy Next.js route handlers move to the Fastify API. The client must keep working at the moment traffic switches.
- **Options:** redesign the API (new error shape `{ error: code, message }`, new paths) and update the client in the same change; or port routes with an identical contract.
- **Decision:** identical paths, bodies, status codes, `{ "error": "<message>" }` errors and session cookies. Repository functions keep the Firestore layer's names and error codes. No `packages/core`: payroll and report math run only in the browser, so the server shares no runtime code with the client; the 75-line demo seed is copied until the web server code is deleted.
- **Consequences:** the cutover is a rewrite switch with no client change and a one-step rollback. Two error shapes exist until phase 3 updates the client (health uses `{ error, message }`).
