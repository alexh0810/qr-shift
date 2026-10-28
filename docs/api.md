# API reference

Base path: `/api`. All responses are JSON. Errors use `{ "error": "<code>", "message": "<user-facing text>" }`.

## Health

### `GET /api/health`

Auth: none.

| Status | Body |
| --- | --- |
| 200 | `{ "status": "ok" }` — the API can query the database |
| 503 | `{ "error": "db_unavailable", "message": "Database unavailable." }` |
