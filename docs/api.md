# API reference

Base path: `/api`. All responses are JSON. Errors use `{ "error": "<code>", "message": "<user-facing text>" }`.

## Health

### `GET /api/health`

Auth: none.

| Status | Body |
| --- | --- |
| 200 | `{ "status": "ok" }` |
