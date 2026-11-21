# API reference

Base path: `/api`. All responses are JSON. Errors: see [Error format](#error-format).

## Health

### `GET /api/health`

Auth: none.

| Status | Body |
| --- | --- |
| 200 | `{ "status": "ok" }` — the API can query the database |
| 503 | `{ "error": "db_unavailable", "message": "Database unavailable." }` |

## Error format

Every error is `{ "error": "<code>", "message": "<user-facing text>" }`; the client shows `message`. The tables below list the `message`; codes are in the error-code table in [architecture](architecture.md#error-codes). Exceptions until phase 3 finishes: the PIN and owner-secret session routes and the 401 guard responses, which still return `{ "error": "<message>" }`.

## Request rules

Requests that change state (`POST`, `PATCH`, `DELETE`) must send `Content-Type: application/json` (or no body) and an `Origin` header equal to the site origin; otherwise the API answers 415 `unsupported_media_type` or 403 `forbidden_origin` (`Request not allowed from this origin.`). Browsers send `Origin` automatically.

## Public routes

Auth: none. Used by the employee scan page.

| Method & path | Body | 200 | Errors |
| --- | --- | --- | --- |
| `GET /api/stores/:qr_token` | — | `{ store: { id, name, qr_token, qr_mode } }` | 404 `Store not found.` |
| `GET /api/stores/:qr_token/employees` | — | `{ store: { id, name, qr_token, qr_mode }, employees: [{ employee, latest_log, status }] }` — active employees only; `status` is `IN` or `OUT` from the latest log | 404 `Store not found.` |
| `GET /api/stores/:qr_token/scan-ticket?w&sig` | — (query: window `w`, signature `sig` from the display QR) | `{ ticket: { storeId, exp, mac } }`, valid 120 s | 404 `store_not_found` · 400 `not_display_mode` · 403 `qr_expired` (QR older than 60 s, tampered, for another store, or `w`/`sig` missing, repeated or malformed) |
| `POST /api/stores/:qr_token/clock` | `{ employeeId, requestedAction: "IN" \| "OUT", ticket?, location?: { lat, lng, accuracy } }` | `{ action, timestamp }` | 400 `Choose an employee and confirm the next action.` · 400 `This shift status changed. Go back and try again.` · 400 `QRShift couldn't save that clock action. Try again.` · 403 `qr_required` (display mode, no ticket) · 403 `qr_expired` (ticket invalid or older than 120 s) |

`location` is optional and never causes an error: printed stores store `inside` / `outside` / `unknown` on the timelog, display stores store none. Timelog objects in manager responses (dashboard roster, reports) carry `location_status` (`inside`, `outside`, `unknown` or `null`); the public roster and the clock response omit it.

Printed stores ignore `ticket`. A ticket is reusable until it expires (120 s), not single-use. A clock action is accepted only if it is the opposite of the employee's latest log. The employee row is locked during the check, so concurrent duplicate scans record one event.

## Session routes

| Method & path | Body | 200 | Errors |
| --- | --- | --- | --- |
| `POST /api/session` | `{ idToken }` (Firebase ID token) | `{ ok: true, email }` + cookie `__session` | 400 `invalid_request` · 401 `invalid_token` (`Sign-in failed. Try again.`) · 403 `email_not_verified` (`Verify your email address, then sign in again.`) |
| `DELETE /api/session` | — | `{ ok: true }`: revokes all of the user's sessions on every device and clears the cookie (cleared even if revocation fails) | — |
| `GET /api/me` | — | `{ email, stores: [{ id, name, qr_token, role }] }`, newest store first | 401 `unauthenticated` (`Sign in to continue.`) |

Cookie `__session`: Firebase session cookie, 5 days, `HttpOnly`, `Secure` in production, `SameSite=Strict`, `Path=/`. Role-guarded routes answer 401 `unauthenticated` without a valid session and 403 `forbidden` (`You don't have access to this store.`) without a sufficient role on that store.

## Manager routes

Auth: cookie `qrshift_manager_session` — an HMAC-SHA256-signed payload `{ kind: "manager", storeId, qrToken, exp }` valid for 7 days, `HttpOnly`, `SameSite=Lax`, `Secure` in production, issued after a correct store PIN (scrypt-hashed). A session only authorizes routes for its own `qr_token`.

| Method & path | Body | 200 | Errors |
| --- | --- | --- | --- |
| `GET /api/manager/session?qr_token=` | — | `{ authenticated }` (for that store, or any store when `qr_token` is omitted) | — |
| `POST /api/manager/session` | `{ qr_token, pin }` | `{ ok: true }` + session cookie | 400 `Enter the manager PIN to continue.` · 400 `This store is not ready for secure manager access yet.` · 401 `Incorrect PIN. Please try again.` |
| `DELETE /api/manager/session` | — | `{ ok: true }`, cookie cleared | — |
| `GET /api/manager/:qr_token/dashboard` | — | `{ store, employees: [{ employee, latest_log, status }] }` | 401 `Manager access is required.` · 404 `Store not found.` |
| `GET /api/manager/:qr_token/reports` | — | `{ store, employees, timelogs }` — all employees including archived; timelogs oldest first, each with `location_status` | 401 · 404 |
| `POST /api/manager/:qr_token/reports` | `{ employeeId, clockInLogId, clockOutLogId \| null, clockInAt, clockOutAt }` (ISO times) | `{ ok: true, clockOutLogId }` | 401 · 400 `Invalid report correction.` · 400 `Clock-out must be after clock-in.` · 400 `Only completed shifts can be saved right now.` · 400 `QRShift couldn't save that report correction. Try again.` |

A correction overwrites the shift's IN and OUT timestamps in one transaction; with `clockOutLogId: null` it creates the missing OUT log.

## Owner routes

Auth: cookie `qrshift_owner_session` (signed `{ kind: "owner", exp }`, same cookie attributes as the manager session), issued after the correct `OWNER_SETUP_SECRET`. Every route except `/api/admin/session` returns 401 `Owner access is required.` without it.

| Method & path | Body | 200 | Errors |
| --- | --- | --- | --- |
| `GET /api/admin/session` | — | `{ authenticated }` | — |
| `POST /api/admin/session` | `{ secret }` | `{ ok: true }` + session cookie | 400 `Enter the owner secret to continue.` · 401 `Incorrect owner secret. Please try again.` |
| `DELETE /api/admin/session` | — | `{ ok: true }`, cookie cleared | — |
| `GET /api/admin/stores` | — | `{ stores: [{ id, name, qr_token, qr_mode, created_at }] }`, newest first | 401 |
| `POST /api/admin/stores` | `{ storeName, pin, employeeNames: string[] }` | `{ storeId, storeName, qrToken }` | 400 `Add a store name, manager PIN, and at least one employee.` · 400 `Manager PIN must be numeric and 6 digits or fewer.` |
| `GET /api/admin/stores/:storeId/employees` | — | `{ store, employees }` — archived included, active first | 401 · 404 `Store not found.` |
| `POST /api/admin/stores/:storeId/employees` | `{ name }` | `{ employee }` | 400 `Enter an employee name.` · 400 `An employee with that name already exists for this store.` · 404 `Store not found.` |
| `PATCH /api/admin/stores/:storeId/employees/:employeeId` | `{ name?, status?: "active" \| "archived" }` | `{ employee }` | 404 `Store not found.` / `Employee not found.` · 400 `This employee does not belong to the selected store.` · 400 duplicate / empty name · 400 `No employee changes were provided.` |
| `POST /api/admin/demo-store` | — | `{ storeId, storeName, qrToken, pin }` — a store with 4 employees and the past 7 days of shifts, one employee still clocked in | 401 |

Employee names are unique per store after trimming, lowercasing and collapsing spaces.

## QR settings routes

Session cookie, role `owner` of the store (`requireRole('owner')`). Managers, owners of other stores and unknown stores get 403 `forbidden`; no session gets 401 `unauthenticated`. Non-GET bodies must be JSON (`{}` when there are no fields). `settings` is `{ qr_mode, has_location, lat, lng, radius_m, display_key }`; `display_key` is `null` unless the store is in display mode and is never returned to anyone but an owner. `qr_secret` is never returned. Every response, including 401 and 403, carries `Cache-Control: no-store`.

| Method & path | Body | 200 | Errors |
| --- | --- | --- | --- |
| `GET /api/admin/stores/:storeId/qr-settings` | — | `settings` | 401 · 403 |
| `PUT /api/admin/stores/:storeId/qr-mode` | `{ qr_mode: "display" \| "printed" }` | `settings`; switching to display creates `qr_secret` and `display_key` atomically when missing (existing values are kept); switching to printed clears `display_key` and keeps `qr_secret` | 400 `invalid_qr_mode` |
| `PUT /api/admin/stores/:storeId/location` | `{ lat, lng, radius_m? }` — `lat` in [-90, 90], `lng` in [-180, 180], `radius_m` integer 25–1000 (kept when omitted); `{ lat: null, lng: null }` clears the location | `settings` | 400 `invalid_location` |
| `POST /api/admin/stores/:storeId/qr/reissue` | `{}` | `{ ok: true }`; new `qr_secret` | 400 `not_display_mode` |
| `POST /api/admin/stores/:storeId/display-key/reset` | `{}` | `settings` with the new `display_key` | 400 `not_display_mode` |

Reissue invalidates every outstanding display QR and clock ticket within seconds. The printed `qr_token` is not rotated because manager dashboard links depend on it. Resetting the display key cuts the old tablet link.

## Display routes

| Method & path | Header | 200 | Errors |
| --- | --- | --- | --- |
| `GET /api/display/:storeId/qr` | `x-display-key: <display_key>` | `{ store_name, qr_token, window, sig, refresh_in_ms }`, `Cache-Control: no-store` | 401 `invalid_display_key` (unknown store, printed store, missing or wrong key: indistinguishable) |

The display key is a bearer secret kept in the tablet page's URL fragment. It is accepted only by this endpoint and cannot read rosters, clock anyone in or reach manager/owner data.
