# Decisions

Each entry: context, options considered, decision, consequences.

## D1. npm workspaces monorepo

- **Context:** The API is being split out of the Next.js app, and both sides need the same domain types and payroll math.
- **Options:** separate repos; a monorepo tool (Turborepo, Nx); plain npm workspaces.
- **Decision:** plain npm workspaces (`web/`, `api/`, later `packages/core`).
- **Consequences:** one lockfile and one CI pipeline; shared code is a workspace import, not a published package. No build caching across workspaces.
