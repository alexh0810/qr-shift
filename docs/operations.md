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
   # Session secrets: use the same values as Vercel's MANAGER_SESSION_SECRET and OWNER_SETUP_SECRET so existing sessions stay valid.
   for name in manager-session-secret owner-setup-secret; do
     printf '%s: ' "$name"
     read -rs VALUE && printf '%s' "$VALUE" | gcloud secrets create $name --data-file=- && unset VALUE
     gcloud secrets add-iam-policy-binding $name \
       --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
       --role=roles/secretmanager.secretAccessor
   done
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
APP_ORIGIN=http://localhost:3000 FIREBASE_PROJECT_ID=qr-shift-f2063 DATABASE_URL=<url> npm run dev -w api   # api on :8080
```
Tests need no database: they run migrations on in-memory PGlite.

## Migrations

1. Change `api/src/db/schema.ts`.
2. `npm run db:generate -w api -- --name <short_name>` and commit `api/drizzle/`.
3. Merged to `main` → `deploy-api` runs `db:migrate` against Neon, then deploys.

Migration `0001_qr_modes` is additive (new `qr_mode` column defaults to `printed`, two nullable columns), so the previous revision keeps working if a deploy step fails.

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
4. Deploy a **candidate revision with no traffic**, tagged `candidate` (`--max-instances 3`, `DATABASE_URL`, `MANAGER_SESSION_SECRET` and `OWNER_SETUP_SECRET` from Secret Manager).
5. Smoke-test the candidate's tagged URL: `GET /api/health`, plus the origin check (a clock request with a forged `Origin` must get 403; one with `APP_ORIGIN` must pass the check and reach the route, which answers 400 for the unknown store). The job fails at the start if the `APP_ORIGIN` variable is empty.
6. Only if it passes: move 100% of traffic to it (`update-traffic --to-latest`).

Order matters for any PR that changes a response shape: the web app must deploy before the API. Vercel finishes about 2 minutes after merge and `deploy-api` about 8, so the order holds; tabs opened before the merge keep the old client until reloaded.

A failed smoke test fails the job and leaves the previous revision serving. On the very first deploy the service does not exist yet, so the revision is created with traffic (Cloud Run rejects `--no-traffic` for a new service); the smoke test then checks the live URL.

## Secrets and configuration

| Name | Kind | Used by |
| --- | --- | --- |
| `DATABASE_URL` | GitHub secret | `db:migrate` in CI |
| `database-url` | Secret Manager | Cloud Run runtime env `DATABASE_URL` |
| `manager-session-secret`, `owner-setup-secret` | Secret Manager | Cloud Run runtime env `MANAGER_SESSION_SECRET`, `OWNER_SETUP_SECRET`; same values as in Vercel |
| `APP_ORIGIN` | GitHub variable, passed to Cloud Run env | Site origin for the CSRF check; set with `gh variable set APP_ORIGIN --body "https://<domain>"`. The deploy fails if it is empty and the API refuses to start without it |
| `FIREBASE_PROJECT_ID` | Cloud Run env (set in `deploy-api`) | Firebase Admin SDK project; the runtime service account needs `roles/firebaseauth.admin` and `identitytoolkit.googleapis.com` enabled |
| `API_ORIGIN` | Vercel env var | `web/next.config.mjs` rewrite of `/api/*` to Cloud Run |
| `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT` | GitHub variables | `deploy-api` |

Rotate the database password: update it in Neon, then `printf '%s' '<url>' | gcloud secrets versions add database-url --data-file=-`, `gh secret set DATABASE_URL`, and redeploy.

## Firebase Authentication setup

1. **Console:** Firebase console → Authentication → Sign-in method → enable Email/Password and Google. Under Settings → Authorized domains, add the Vercel production domain.
2. **Enable the API and grant the runtime service account access** (once):
   ```bash
   gcloud services enable identitytoolkit.googleapis.com
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
     --role=roles/firebaseauth.admin
   ```
3. **Vercel:** set `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `NEXT_PUBLIC_FIREBASE_APP_ID` from the Firebase web app config (public values), then redeploy.

The API reads `FIREBASE_PROJECT_ID` (set by `deploy-api`) and authenticates to Firebase with the Cloud Run service account; there are no key files.

## Firestore import

`npm run import:firestore -w @qrshift/api` copies every store, employee and timelog from Firestore into Postgres, keeping document IDs as primary keys.

- **Replaces** all rows in `stores`, `employees` and `timelogs` in one transaction. Run it only at cutover, with Firestore writes stopped. Re-running it before the API takes traffic is safe; after that it deletes every clock-in recorded in Postgres since.
- **Fails** once `assign-owner` has run, because `store_members` references `stores`. It is a cutover-only tool and must not be re-run after the API takes traffic anyway.
- **Refuses** to import bad data instead of guessing: a store with only a plaintext PIN (run `npm run migrate:pins -w @qrshift/web` first), a missing or invalid timestamp, an employee status other than `active`/`archived`, a timelog type other than `IN`/`OUT`, a timelog filed under a different store than its employee, or a timelog of an employee that never existed. The error names the document.
- **Wipes QR settings:** the import writes every store as `printed` with no secret or display key, so re-running it deletes QR settings along with the store rows. It is a cutover-only tool.
- **Skips** employees and timelogs of deleted stores, which the app can no longer show, and prints how many it skipped per run. They stay in Firestore until phase 3.
- **Verifies** afterwards by reading every Postgres row back and comparing it with the rows mapped from Firestore. It exits non-zero on any difference.

Env: `DATABASE_URL` (Neon, `sslmode=verify-full`) and the `FIREBASE_ADMIN_*` values from `web/.env.local`:

```bash
cd api
set -a && source ../web/.env.local && set +a
read -rs DATABASE_URL && export DATABASE_URL
npm run import:firestore
```

## Cutover from Firestore

The web app forwards `/api/*` to Cloud Run only when the Vercel env var `API_ORIGIN` is set (`web/next.config.mjs`). Switching and rolling back are env changes plus a redeploy.

1. Confirm the latest `deploy-api` run on `main` is green and `GET <cloud run url>/api/health` returns `{"status":"ok"}`.
2. **Preview first:** in Vercel → Settings → Environment Variables, add `API_ORIGIN = <cloud run url>` for **Preview** only, then deploy a preview of current main: `git push origin main:cutover-preview`. This preview reads and writes the **production** Neon database; the demo store and clock-ins created here are wiped by the import in step 3. Require `<preview url>/api/health` → `{"status":"ok"}` (the legacy app has no health route and returns 404, so this proves the rewrite is live). Then: open `/admin`, sign in, create a demo store, scan its QR page, clock in, sign in as manager, check the dashboard and reports, save one correction. Afterwards delete the Preview `API_ORIGIN` and the branch (`git push origin --delete cutover-preview`) so PR previews don't hit the production database.
3. **Import:** do steps 3–4 outside shift hours: Firestore writes cannot be stopped from here, and a clock-in between the import and the switch is not copied. Note the import start time, then run the [Firestore import](#firestore-import). It must end with `Parity check passed`.
4. **Switch production:** add `API_ORIGIN` for **Production**, then redeploy production. Require `<production url>/api/health` → `{"status":"ok"}`. Smoke-test writes (clock-in, correction) on a demo store only; on real stores only open the dashboard and reports. Then check Firestore has no timelog newer than the import start time. If it does, re-run the import before any new Postgres clock-ins (safe until then) or re-enter them by hand.
5. **Watch:** Cloud Run logs and the dashboard for an hour.

**Rollback:** first use Vercel Instant Rollback to the previous production deployment (built without `API_ORIGIN`, takes seconds). Then delete `API_ORIGIN` from Production so the next deploy doesn't switch back. Writes made to Postgres after the switch are not copied back; re-enter them by hand if a rollback happens.

Firestore stays unused (not deleted) for 7 days after the switch. Phase 3 then deletes `web/src/app/api`, `web/src/lib/server-*.ts`, `firebase-admin` in web and `firestore.rules`.

## Assign owner

Makes one email owner of every store; safe to re-run, and upgrades an existing manager row to owner. Run it after the `store_members` migration is deployed.

```bash
cd api
export OWNER_EMAIL='<email>'
read -rs DATABASE_URL && export DATABASE_URL
npm run assign-owner
```

It prints how many stores the email now owns. Stores created later are not covered; re-run it.

## QR modes (until the owner UI exists)

Display mode is enabled per store. Until the owner console has controls for it, use SQL on Neon (replace `<store id>`). Secrets are 256-bit random values: 32 bytes from `gen_random_bytes` (pgcrypto), hex-encoded to 64 characters.

```sql
create extension if not exists pgcrypto;

update stores
set qr_mode = 'display',
    qr_secret = coalesce(qr_secret, encode(gen_random_bytes(32), 'hex')),
    display_key = coalesce(display_key, encode(gen_random_bytes(32), 'hex'))
where id = '<store id>'
returning id, display_key;
```

Open `https://qr-shift-six.vercel.app/display/<store id>#<display_key>` on the store tablet. Treat that link like a password.

- Back to printed mode: `update stores set qr_mode = 'printed' where id = '<store id>';` (the printed `/scan/<qr_token>` QR works again immediately).
- Reissue the QR (invalidates every outstanding QR and ticket): `update stores set qr_secret = encode(gen_random_bytes(32), 'hex') where id = '<store id>';`
- Reset the display link: the same statement for `display_key`, then open the new link.

Tablet setup: set the screen to never sleep and keep the display tab in the foreground (a background tab or locked screen stops refreshing; the page reloads the QR as soon as the tab is visible again). It re-fetches the QR at every 30 s window and keeps retrying if the connection drops.

## Rollback

```bash
gcloud run revisions list --service qrshift-api --region europe-west3
gcloud run services update-traffic qrshift-api --region europe-west3 --to-revisions <previous-revision>=100
```
Migrations are forward-only; a rollback that needs schema changes is a new migration.

## Health check

`curl https://<service-url>/api/health` → `{"status":"ok"}` means the API is up and can query Neon.
