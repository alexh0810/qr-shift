# Operations

## Environments

| Part | Where | Deployed by |
| --- | --- | --- |
| Web | Vercel, root directory `web` | Vercel Git integration on push |
| API | Cloud Run service `qrshift-api`, `europe-west3` | `deploy-api` job on push to `main` |
| Database | Neon project `qrshift`, `aws-eu-central-1` | Migrations in `deploy-api` before the deploy |

## One-time setup

Region for both: Frankfurt (`europe-west3` on GCP, `aws-eu-central-1` on Neon). The Firebase project is the GCP project; billing must be enabled.

1. **Neon:** create project `qrshift` in `aws-eu-central-1`. Copy the **direct** (non-pooled) connection string and change `sslmode=require` to `sslmode=verify-full`. Both verify the server certificate today, but `pg` warns that `require` will mean less in its next major version.
2. **Migrate once by hand** to prove the URL works:
   ```bash
   DATABASE_URL='<neon url>' npm run db:migrate -w api
   ```
3. **GCP:**
   ```bash
   PROJECT_ID=<firebase project id>
   REGION=europe-west3
   gcloud config set project $PROJECT_ID
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com iamcredentials.googleapis.com secretmanager.googleapis.com
   gcloud artifacts repositories create qrshift --repository-format=docker --location=$REGION
   # Keep the 3 newest images so storage stays inside the 0.5 GB free tier.
   printf '%s' '[{"name":"keep-3","action":{"type":"Keep"},"mostRecentVersions":{"keepCount":3}},{"name":"delete-rest","action":{"type":"Delete"},"condition":{"tagState":"ANY"}}]' > /tmp/ar-cleanup.json
   gcloud artifacts repositories set-cleanup-policies qrshift --location=$REGION --policy=/tmp/ar-cleanup.json --no-dry-run
   printf '%s' '<neon url>' | gcloud secrets create database-url --data-file=-
   gcloud secrets add-iam-policy-binding database-url \
     --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
     --role=roles/secretmanager.secretAccessor
   gcloud iam service-accounts create github-deployer
   SA=github-deployer@$PROJECT_ID.iam.gserviceaccount.com
   for role in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
     gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role=$role
   done
   gcloud iam workload-identity-pools create github --location=global
   gcloud iam workload-identity-pools providers create-oidc github-repo \
     --location=global --workload-identity-pool=github \
     --issuer-uri=https://token.actions.githubusercontent.com \
     --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository \
     --attribute-condition="assertion.repository=='alexh0810/qr-shift' && assertion.ref=='refs/heads/main'"
   gcloud iam service-accounts add-iam-policy-binding $SA --role=roles/iam.workloadIdentityUser \
     --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/alexh0810/qr-shift"
   ```
4. **Budget alert:** Cloud Console → Billing → Budgets & alerts → $1, alerts at 50/90/100%.
5. **GitHub settings** (as `alexh0810`):
   ```bash
   gh variable set GCP_PROJECT_ID --body "$PROJECT_ID"
   gh variable set GCP_REGION --body "$REGION"
   gh variable set GCP_SERVICE_ACCOUNT --body "$SA"
   gh variable set GCP_WIF_PROVIDER --body "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-repo"
   gh secret set DATABASE_URL   # paste the Neon URL
   ```

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

**Migrations must be backward compatible with the revision that is still serving.** They run before the new code deploys, and if any later step fails (image build, deploy, smoke test), the old revision keeps running against the new schema. So expand, then contract:

- Add tables, add nullable columns, or add columns with defaults in one PR.
- Remove or rename a column only in a later PR, after no deployed code reads it.
- Never change a column's type in place; add a new column, backfill, switch the code, then drop the old one.

## Deploy pipeline

`verify` (lint, typecheck, unit tests, build, Playwright end-to-end tests) → `deploy-api`:

1. Migrate Neon (`db:migrate`).
2. Authenticate to GCP with Workload Identity Federation (no stored keys).
3. Build `api/Dockerfile` and push to Artifact Registry `qrshift`.
4. Deploy a **candidate revision with no traffic**, tagged `candidate` (`--max-instances 3`, `DATABASE_URL` from Secret Manager `database-url`).
5. Smoke-test `GET /api/health` on the candidate's tagged URL.
6. Only if it passes: move 100% of traffic to it (`update-traffic --to-latest`).

A failed smoke test fails the job and leaves the previous revision serving. On the very first deploy the service does not exist yet, so the revision is created with traffic (Cloud Run rejects `--no-traffic` for a new service); the smoke test then checks the live URL.

## Secrets and configuration

| Name | Kind | Used by |
| --- | --- | --- |
| `DATABASE_URL` | GitHub secret | `db:migrate` in CI |
| `database-url` | Secret Manager | Cloud Run runtime env `DATABASE_URL` |
| `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT` | GitHub variables | `deploy-api` |

Rotate the database password: update it in Neon, then `printf '%s' '<url>' | gcloud secrets versions add database-url --data-file=-`, `gh secret set DATABASE_URL`, and redeploy.

## Firestore import

`npm run import:firestore -w @qrshift/api` copies every store, employee and timelog from Firestore into Postgres, keeping document IDs as primary keys.

- **Replaces** all rows in `stores`, `employees` and `timelogs` in one transaction. Run it only at cutover, with Firestore writes stopped. Re-running it before the API takes traffic is safe; after that it deletes every clock-in recorded in Postgres since.
- **Refuses** to import bad data instead of guessing: a store with only a plaintext PIN (run `npm run migrate:pins -w @qrshift/web` first), a missing or invalid timestamp, a timelog type other than `IN`/`OUT`, or a reference to a missing store or employee. The error names the document.
- **Verifies** afterwards by reading every Postgres row back and comparing it with the rows mapped from Firestore. It exits non-zero on any difference.

Env: `DATABASE_URL` (Neon, `sslmode=verify-full`) and the `FIREBASE_ADMIN_*` values from `web/.env.local`:

```bash
cd api
set -a && source ../web/.env.local && set +a
read -rs DATABASE_URL && export DATABASE_URL
npm run import:firestore
```

## Rollback

```bash
gcloud run revisions list --service qrshift-api --region europe-west3
gcloud run services update-traffic qrshift-api --region europe-west3 --to-revisions <previous-revision>=100
```
Migrations are forward-only; a rollback that needs schema changes is a new migration.

## Health check

`curl https://<service-url>/api/health` → `{"status":"ok"}` means the API is up and can query Neon.
