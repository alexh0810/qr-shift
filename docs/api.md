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

Health uses `{ "error": "<code>", "message": "<text>" }`. All other routes keep the original contract: `{ "error": "<user-facing message>" }` with the status codes listed below (see D6 in [decisions](decisions.md)).

## Public routes

Auth: none. Used by the employee scan page.

| Method & path | Body | 200 | Errors |
| --- | --- | --- | --- |
| `GET /api/stores/:qr_token` | — | `{ store: { id, name, qr_token } }` | 404 `Store not found.` |
| `GET /api/stores/:qr_token/employees` | — | `{ store, employees: [{ employee, latest_log, status }] }` — active employees only; `status` is `IN` or `OUT` from the latest log | 404 `Store not found.` |
| `POST /api/stores/:qr_token/clock` | `{ employeeId, requestedAction: "IN" \| "OUT" }` | `{ action, timestamp }` | 400 `Choose an employee and confirm the next action.` · 400 `This shift status changed. Go back and try again.` · 400 `QRShift couldn't save that clock action. Try again.` |

A clock action is accepted only if it is the opposite of the employee's latest log. The employee row is locked during the check, so concurrent duplicate scans record one event.

## Manager routes

Auth: cookie `qrshift_manager_session` — an HMAC-SHA256-signed payload `{ kind: "manager", storeId, qrToken, exp }` valid for 7 days, `HttpOnly`, `SameSite=Lax`, `Secure` in production, issued after a correct store PIN (scrypt-hashed). A session only authorizes routes for its own `qr_token`.

| Method & path | Body | 200 | Errors |
| --- | --- | --- | --- |
| `GET /api/manager/session?qr_token=` | — | `{ authenticated }` (for that store, or any store when `qr_token` is omitted) | — |
| `POST /api/manager/session` | `{ qr_token, pin }` | `{ ok: true }` + session cookie | 400 `Enter the manager PIN to continue.` · 400 `This store is not ready for secure manager access yet.` · 401 `Incorrect PIN. Please try again.` |
| `DELETE /api/manager/session` | — | `{ ok: true }`, cookie cleared | — |
| `GET /api/manager/:qr_token/dashboard` | — | `{ store, employees: [{ employee, latest_log, status }] }` | 401 `Manager access is required.` · 404 `Store not found.` |
| `GET /api/manager/:qr_token/reports` | — | `{ store, employees, timelogs }` — all employees including archived; timelogs oldest first | 401 · 404 |
| `POST /api/manager/:qr_token/reports` | `{ employeeId, clockInLogId, clockOutLogId \| null, clockInAt, clockOutAt }` (ISO times) | `{ ok: true, clockOutLogId }` | 401 · 400 `Invalid report correction.` · 400 `Clock-out must be after clock-in.` · 400 `Only completed shifts can be saved right now.` · 400 `QRShift couldn't save that report correction. Try again.` |

A correction overwrites the shift's IN and OUT timestamps in one transaction; with `clockOutLogId: null` it creates the missing OUT log.

## Owner routes

Auth: cookie `qrshift_owner_session` (signed `{ kind: "owner", exp }`, same cookie attributes as the manager session), issued after the correct `OWNER_SETUP_SECRET`. Every route except `/api/admin/session` returns 401 `Owner access is required.` without it.

| Method & path | Body | 200 | Errors |
| --- | --- | --- | --- |
| `GET /api/admin/session` | — | `{ authenticated }` | — |
| `POST /api/admin/session` | `{ secret }` | `{ ok: true }` + session cookie | 400 `Enter the owner secret to continue.` · 401 `Incorrect owner secret. Please try again.` |
| `DELETE /api/admin/session` | — | `{ ok: true }`, cookie cleared | — |
| `GET /api/admin/stores` | — | `{ stores: [{ id, name, qr_token, created_at }] }`, newest first | 401 |
| `POST /api/admin/stores` | `{ storeName, pin, employeeNames: string[] }` | `{ storeId, storeName, qrToken }` | 400 `Add a store name, manager PIN, and at least one employee.` · 400 `Manager PIN must be numeric and 6 digits or fewer.` |
| `GET /api/admin/stores/:storeId/employees` | — | `{ store, employees }` — archived included, active first | 404 `Store not found.` |
| `POST /api/admin/stores/:storeId/employees` | `{ name }` | `{ employee }` | 400 `Enter an employee name.` · 400 `An employee with that name already exists for this store.` · 404 `Store not found.` |
| `PATCH /api/admin/stores/:storeId/employees/:employeeId` | `{ name?, status?: "active" \| "archived" }` | `{ employee }` | 404 `Store not found.` / `Employee not found.` · 400 `This employee does not belong to the selected store.` · 400 duplicate / empty name · 400 `No employee changes were provided.` |
| `POST /api/admin/demo-store` | — | `{ storeId, storeName, qrToken, pin }` — a store with 4 employees and about 2 weeks of shifts | 401 |

Employee names are unique per store after trimming, lowercasing and collapsing spaces.
