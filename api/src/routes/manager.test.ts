import assert from "node:assert/strict";
import { test } from "node:test";

import { corrections } from "../db/schema.js";
import { buildTestApp, seededDb, sessionFor } from "../test-support.js";

const managerCookie = () => sessionFor("bob@example.com");

test("dashboard and reports need a session and membership in that store", async () => {
  const app = buildTestApp(await seededDb());
  for (const url of ["/api/manager/qr-1/dashboard", "/api/manager/qr-1/reports"]) {
    const anonymous = await app.inject({ method: "GET", url });
    assert.deepEqual([anonymous.statusCode, anonymous.json().error], [401, "unauthenticated"]);
  }
  for (const url of ["/api/manager/qr-2/dashboard", "/api/manager/qr-2/reports", "/api/manager/missing/dashboard"]) {
    const denied = await app.inject({ method: "GET", url, cookies: managerCookie() });
    assert.deepEqual([denied.statusCode, denied.json().error], [403, "forbidden"]);
  }
  const correction = await app.inject({ method: "POST", url: "/api/manager/qr-2/reports", cookies: managerCookie(), payload: {} });
  assert.equal(correction.statusCode, 403);
});

test("owners can use manager routes of their own stores only", async () => {
  const app = buildTestApp(await seededDb());
  const own = await app.inject({ method: "GET", url: "/api/manager/qr-1/dashboard", cookies: sessionFor("alice@example.com") });
  assert.equal(own.statusCode, 200);
  const other = await app.inject({ method: "GET", url: "/api/manager/qr-1/dashboard", cookies: sessionFor("carol@example.com") });
  assert.equal(other.statusCode, 403);
});

test("dashboard serializes employee statuses", async () => {
  const app = buildTestApp(await seededDb());
  const body = (await app.inject({ method: "GET", url: "/api/manager/qr-1/dashboard", cookies: managerCookie() })).json();
  assert.deepEqual(body.store, { id: "store-1", name: "Downtown", qr_token: "qr-1", qr_mode: "printed" });
  assert.deepEqual(body.employees.map((entry: { status: string }) => entry.status), ["OUT", "IN"]);
});

test("reports GET returns employees and ISO timelogs", async () => {
  const app = buildTestApp(await seededDb());
  const body = (await app.inject({ method: "GET", url: "/api/manager/qr-1/reports", cookies: managerCookie() })).json();
  assert.equal(body.employees.length, 3);
  assert.equal(body.timelogs[0].timestamp, "2026-04-20T08:00:00.000Z");
});

test("reports GET returns the correction history with ISO timestamps", async () => {
  const app = buildTestApp(await seededDb());
  await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: { employeeId: "emp-2", clockInLogId: "log-3", clockOutLogId: null, clockInAt: "2026-04-21T08:00:00Z", clockOutAt: "2026-04-21T15:00:00Z", reason: "Forgot to clock out" },
  });
  const body = (await app.inject({ method: "GET", url: "/api/manager/qr-1/reports", cookies: managerCookie() })).json();
  assert.equal(body.corrections.length, 1);
  const [row] = body.corrections;
  assert.deepEqual(
    [row.old_timestamp, row.new_timestamp, row.changed_by, row.reason],
    [null, "2026-04-21T15:00:00.000Z", "bob@example.com", "Forgot to clock out"],
  );
  assert.match(row.created_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("reports POST validates payloads and maps errors", async () => {
  const app = buildTestApp(await seededDb());
  const invalid = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: { employeeId: "emp-1", clockInLogId: "log-1", clockInAt: "not-a-date", clockOutAt: "2026-04-20T17:00:00Z" },
  });
  assert.equal(invalid.statusCode, 400);
  assert.deepEqual(invalid.json(), { error: "invalid_request", message: "Invalid report correction." });

  const future = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: {
      employeeId: "emp-1",
      clockInLogId: "log-1",
      clockOutLogId: "log-2",
      clockInAt: "2026-04-20T09:00:00Z",
      clockOutAt: new Date(Date.now() + 3_600_000).toISOString(),
      reason: "Forgot to clock",
    },
  });
  assert.deepEqual(future.json(), { error: "future_correction_not_supported", message: "Only completed shifts can be saved right now." });

  const range = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: { employeeId: "emp-1", clockInLogId: "log-1", clockOutLogId: "log-2", clockInAt: "2026-04-20T10:00:00Z", clockOutAt: "2026-04-20T09:00:00Z", reason: "Forgot to clock" },
  });
  assert.deepEqual(range.json(), { error: "invalid_range", message: "Clock-out must be after clock-in." });
});

test("reports POST saves a correction", async () => {
  const app = buildTestApp(await seededDb());
  const response = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: { employeeId: "emp-2", clockInLogId: "log-3", clockOutLogId: null, clockInAt: "2026-04-21T08:00:00Z", clockOutAt: "2026-04-21T15:00:00Z", reason: "Forgot to clock" },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().ok, true);
  assert.equal(typeof response.json().clockOutLogId, "string");
});

test("reports POST rejects corrections for another store's employee", async () => {
  const app = buildTestApp(await seededDb());
  const response = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: { employeeId: "emp-9", clockInLogId: "log-1", clockOutLogId: null, clockInAt: "2026-04-20T08:00:00Z", clockOutAt: "2026-04-20T09:00:00Z", reason: "Forgot to clock" },
  });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), { error: "report_correction_failed", message: "QRShift couldn't save that report correction. Try again." });
});

test("reports POST requires a reason of 3 to 500 characters", async () => {
  const app = buildTestApp(await seededDb());
  const send = (reason?: unknown) =>
    app.inject({
      method: "POST",
      url: "/api/manager/qr-1/reports",
      cookies: managerCookie(),
      payload: { employeeId: "emp-1", clockInLogId: "log-1", clockOutLogId: "log-2", clockInAt: "2026-04-20T09:00:00Z", clockOutAt: "2026-04-20T17:00:00Z", reason },
    });
  for (const reason of [undefined, "", "  ab  ", 42]) {
    const response = await send(reason);
    assert.deepEqual([response.statusCode, response.json().error], [400, "reason_required"]);
  }
  const emoji = await send("😀😀");
  assert.deepEqual([emoji.statusCode, emoji.json().error], [400, "reason_required"]);
  assert.equal((await send("😀😀😀")).statusCode, 200);
  const long = await send("x".repeat(501));
  assert.deepEqual([long.statusCode, long.json().error], [400, "reason_too_long"]);
});

test("reports POST records the session email and the trimmed reason", async () => {
  const db = await seededDb();
  const app = buildTestApp(db);
  const response = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: sessionFor("Bob@Example.com"),
    payload: { employeeId: "emp-1", clockInLogId: "log-1", clockOutLogId: "log-2", clockInAt: "2026-04-20T09:00:00Z", clockOutAt: "2026-04-20T16:00:00Z", reason: "  Late scan  ", changedBy: "mallory@example.com" },
  });
  assert.equal(response.statusCode, 200);
  const rows = await db.select().from(corrections);
  assert.deepEqual(rows.map((row) => [row.timelog_id, row.changed_by, row.reason]), [["log-1", "bob@example.com", "Late scan"]]);
});
