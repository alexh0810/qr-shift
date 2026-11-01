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
