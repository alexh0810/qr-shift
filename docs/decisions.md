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

**Superseded by D8** (error shape only).

- **Context:** The legacy Next.js route handlers move to the Fastify API. The client must keep working at the moment traffic switches.
- **Options:** redesign the API (new error shape `{ error: code, message }`, new paths) and update the client in the same change; or port routes with an identical contract.
- **Decision:** identical paths, bodies, status codes, `{ "error": "<message>" }` errors and session cookies. Repository functions keep the Firestore layer's names and error codes. No `packages/core`: payroll and report math run only in the browser, so the server shares no runtime code with the client; the 75-line demo seed was copied until the web server code was deleted.
- **Consequences:** the cutover is a rewrite switch with no client change and a one-step rollback. Two error shapes exist until phase 3 updates the client (health uses `{ error, message }`).

## D7. Cutover by rewrite, controlled by one env var

- **Context:** Production must move from the Next.js handlers + Firestore to the API + Postgres without client changes, with a fast way back.
- **Options:** delete the Next.js handlers and deploy; proxy per route group; a single `beforeFiles` rewrite gated on `API_ORIGIN`.
- **Decision:** one rewrite of `/api/*` to `API_ORIGIN` (default `http://127.0.0.1:8080`); during cutover it was gated on `API_ORIGIN` and tried on Preview first.
- **Consequences:** cutover was an env change plus redeploy, with a rewrite-switch rollback; that path is now closed (see D11). Legacy handlers, Firestore code, `firestore.rules`, `firebase-admin` in web and the web copy of the demo seed were deleted in phase 3 (T9); Firestore data is untouched but unused, and the rewrite is now unconditional (`API_ORIGIN` defaults to `http://127.0.0.1:8080`).

## D8. One error shape: `{ error: code, message }`

- **Context:** Ported routes kept the legacy `{ error: "<message>" }` shape (D6). The client changes for accounts in this phase anyway.
- **Options:** keep two shapes; switch every route to `{ error: <code>, message }` and have the client read `message`.
- **Decision:** switch every surviving route; one `sendError` helper, a global error handler (4xx keep their message, 5xx become a generic `internal_error`) and a JSON `404`. User-facing messages are unchanged.
- **Consequences:** clients and tests can branch on stable codes; unexpected errors never leak internals. The client falls back to `error` when `message` is absent, which keeps the e2e mocks working. The web app must deploy before the API, because it reads `message ?? error`; Vercel finishes about 2 minutes after merge and `deploy-api` about 8, so the order holds. Browser tabs opened before the merge show raw codes until reloaded.

## D9. Firebase session cookies and `store_members` roles

- **Context:** The store PIN and the shared owner secret give no per-person access, no revocation and no audit identity.
- **Options:** send Firebase ID tokens as bearer tokens on every call; verify them in a Next.js middleware; exchange the ID token once for a server-side session cookie and check roles in the API.
- **Decision:** `POST /api/session` exchanges a verified-email ID token for a Firebase session cookie (5 days, `__session`, `HttpOnly; Secure; SameSite=Strict`). Routes use `requireSession` / `requireRole(role)`; membership lives in `store_members (store_id, email, role)`. Verification sits behind an `AuthVerifier` interface so tests use a fake and production uses firebase-admin. Sign-out revokes all of the user's sessions on every device (`revokeRefreshTokens`). ID tokens are verified with revocation checks, and Firebase rejects ID tokens older than 5 minutes when creating a session cookie (fixation guard). Only `auth/*` rejections map to 401; other Firebase failures are 500s.
- **Consequences:** sign-out and account disabling take effect immediately (`checkRevoked`), at the cost of one Identity Toolkit lookup per authenticated request. Authorization is by email, so an email must be verified before a session exists. Production credentials are the Cloud Run service account (no key files). Stores are created by any signed-in user, who becomes owner; owners add managers by email (`/members`). `shortcut: no quota on store creation, add one before opening sign-up publicly`.

## D10. CSRF: Strict cookie, JSON-only bodies, Origin check

- **Context:** Cookie sessions make state-changing endpoints CSRF targets.
- **Options:** CSRF tokens; Origin check only; layered defences without per-request tokens.
- **Decision:** three independent layers (see the security model): `SameSite=Strict`, JSON-only bodies (the `text/plain` parser is removed so every non-JSON type gets 415) with no CORS, and a global Origin check against `APP_ORIGIN`. The hook is `onRequest` (before body parsing) and also rejects a missing `Origin` on non-GET.
- **Consequences:** no token plumbing in the client. Non-browser clients must send an `Origin`. Vercel previews cannot write to the production API (they fail the Origin check).

## D11. PINs removed; rollback window to the legacy app closed

- **Context:** With accounts live, the PIN column, PIN hashing, the owner secret and the migration script have no readers.
- **Options:** keep the column "just in case"; drop it in the same release as the code change; drop it in a later PR after the code stopped using it.
- **Decision:** expand/contract: the role-routes release removed every use (and the Drizzle column) without a migration; migration `0004` drops the column once that revision is serving. The Secret Manager secrets `manager-session-secret` and `owner-setup-secret` are deleted afterwards.
- **Consequences:** the previous revision keeps working against the old schema until the contract migration ships. After accounts went live the legacy Next.js handlers and PIN sessions cannot be restored by a rewrite switch; rollback is Vercel Instant Rollback plus a Cloud Run revision rollback. Dropped data (PIN hashes) is not recoverable.

## D12. Stateless HMAC windows for the rotating QR

- **Context:** In display mode a clock-in must prove the employee saw the tablet in the last minute, without a server-side session table.
- **Options:** random one-time codes stored in Postgres; signed time windows; JWTs.
- **Decision:** `HMAC-SHA256(qr_secret, ["w", storeId, window])` over 30 s windows, current plus previous window accepted, then a 120 s HMAC ticket for the clock call.
- **Consequences:** nothing to store or clean up; a forwarded screenshot works for up to 60 s (documented limit); the ticket allows several clock actions within 120 s; rotating `qr_secret` is the revoke switch.

## D13. Display key as a bearer secret in the URL fragment

- **Context:** The store tablet has no login and must fetch the rotating QR repeatedly.
- **Options:** owner session on the tablet; per-store key; no key (public endpoint).
- **Decision:** a random per-store `display_key`, sent in the `x-display-key` header; the page reads it from the URL fragment so it never reaches server logs. It works only on `GET /api/display/:storeId/qr`; the owner resets it from the QR settings (`POST /api/admin/stores/:storeId/display-key/reset`). It is 256-bit random (generated with `newSecret()`), so brute force needs no throttle. Stored as plain text (like `qr_secret`; a database leak exposes both anyway).
- **Consequences:** anyone with the link can show the store's QR from anywhere, so the link is treated like a password; resetting the key cuts a leaked link immediately.

## D14. Location is an advisory flag, never a gate

- **Context:** Printed QR codes can be photographed and used off-site; GPS in browsers is coarse and sometimes denied.
- **Options:** block clock-ins outside a geofence; flag them; ignore location.
- **Decision:** record `inside` / `outside` / `unknown` per clock event and expose it to managers only (reports show a warning and a CSV `Location` column). Tolerance is `min(accuracy, 100 m)`, accuracy above 200 m is `unknown`. A store without coordinates records nothing, so owners who skip setup see no noise.
- **Consequences:** honest employees with bad GPS are never locked out; the flag deters, it does not prevent. Spoofed coordinates pass (documented limit).
