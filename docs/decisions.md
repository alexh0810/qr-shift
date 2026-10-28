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
