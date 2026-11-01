# Operations

## Environments

| Part | Where | Deployed by |
| --- | --- | --- |
| Web | Vercel, root directory `web` | Vercel Git integration on push |
| API | Cloud Run service `qrshift-api`, `europe-west3` | `deploy-api` job on push to `main` |
| Database | Neon project `qrshift`, `aws-eu-central-1` | Migrations in `deploy-api` before the deploy |

## Local development

```bash
npm install
npm run dev               # web on :3000
DATABASE_URL=<url> npm run dev -w api   # api on :8080
```
Tests need no database: they run migrations on in-memory PGlite.

## Migrations

1. Change `api/src/db/schema.ts`.
2. `npm run db:generate -w api -- --name <short_name>` and commit `api/drizzle/`.
3. Merged to `main` → `deploy-api` runs `db:migrate` against Neon, then deploys.

At most one migration per PR. If two branches both add one, rebase the second and regenerate.

**Migrations must be backward compatible with the revision that is still serving.** They run before the new code deploys, and if the smoke test fails the old revision keeps running against the new schema. So expand, then contract:

- Add tables, add nullable columns, or add columns with defaults in one PR.
- Remove or rename a column only in a later PR, after no deployed code reads it.
- Never change a column's type in place; add a new column, backfill, switch the code, then drop the old one.

## Deploy pipeline

`verify` (lint, typecheck, tests, build) → `deploy-api`:

1. Migrate Neon (`db:migrate`).
2. Authenticate to GCP with Workload Identity Federation (no stored keys).
3. Build `api/Dockerfile` and push to Artifact Registry `qrshift`.
4. Deploy a **candidate revision with no traffic**, tagged `candidate` (`--max-instances 3`, `DATABASE_URL` from Secret Manager `database-url`).
5. Smoke-test `GET /api/health` on the candidate's tagged URL.
6. Only if it passes: move 100% of traffic to it (`update-traffic --to-latest`).

A failed smoke test fails the job and leaves the previous revision serving. The very first deploy skips steps 4–5 because Cloud Run cannot create a service with no traffic.

## Secrets and configuration

| Name | Kind | Used by |
| --- | --- | --- |
| `DATABASE_URL` | GitHub secret | `db:migrate` in CI |
| `database-url` | Secret Manager | Cloud Run runtime env `DATABASE_URL` |
| `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT` | GitHub variables | `deploy-api` |

Rotate the database password: update it in Neon, then `printf '%s' '<url>' | gcloud secrets versions add database-url --data-file=-`, `gh secret set DATABASE_URL`, and redeploy.

## Rollback

```bash
gcloud run revisions list --service qrshift-api --region europe-west3
gcloud run services update-traffic qrshift-api --region europe-west3 --to-revisions <previous-revision>=100
```
Migrations are forward-only; a rollback that needs schema changes is a new migration.

## Health check

`curl https://<service-url>/api/health` → `{"status":"ok"}` means the API is up and can query Neon.
