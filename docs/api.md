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
