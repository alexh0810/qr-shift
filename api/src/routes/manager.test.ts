import assert from "node:assert/strict";
import { test } from "node:test";

import { buildApp } from "../app.js";
import { MANAGER_SESSION_COOKIE, createManagerSessionValue } from "../auth.js";
import { seededDb } from "../test-support.js";

const managerCookie = () => ({ [MANAGER_SESSION_COOKIE]: createManagerSessionValue("store-1", "qr-1") });

test("manager login rejects missing input, stores without a PIN, and wrong PINs", async () => {
  const app = buildApp({ db: await seededDb() });
  const missing = await app.inject({ method: "POST", url: "/api/manager/session", payload: { qr_token: "qr-1" } });
  assert.equal(missing.statusCode, 400);
  assert.deepEqual(missing.json(), { error: "Enter the manager PIN to continue." });

  const noPin = await app.inject({ method: "POST", url: "/api/manager/session", payload: { qr_token: "qr-2", pin: "1234" } });
  assert.equal(noPin.statusCode, 400);
  assert.deepEqual(noPin.json(), { error: "This store is not ready for secure manager access yet." });

  const wrong = await app.inject({ method: "POST", url: "/api/manager/session", payload: { qr_token: "qr-1", pin: "0000" } });
  assert.equal(wrong.statusCode, 401);
  assert.deepEqual(wrong.json(), { error: "Incorrect PIN. Please try again." });
});

test("manager login sets a session cookie scoped to the store", async () => {
  const app = buildApp({ db: await seededDb() });
  const login = await app.inject({ method: "POST", url: "/api/manager/session", payload: { qr_token: "qr-1", pin: "1234" } });
  assert.deepEqual(login.json(), { ok: true });
  const cookie = login.cookies.find((entry) => entry.name === MANAGER_SESSION_COOKIE);
  assert.ok(cookie?.value);
  assert.equal(cookie?.httpOnly, true);
  assert.equal(cookie?.sameSite, "Lax");

  const cookies = { [MANAGER_SESSION_COOKIE]: cookie!.value };
  const own = await app.inject({ method: "GET", url: "/api/manager/session?qr_token=qr-1", cookies });
  const other = await app.inject({ method: "GET", url: "/api/manager/session?qr_token=qr-2", cookies });
  const any = await app.inject({ method: "GET", url: "/api/manager/session", cookies });
  assert.deepEqual([own.json(), other.json(), any.json()], [
    { authenticated: true },
    { authenticated: false },
    { authenticated: true },
  ]);
});

test("manager logout clears the cookie", async () => {
  const app = buildApp({ db: await seededDb() });
  const response = await app.inject({ method: "DELETE", url: "/api/manager/session" });
  assert.deepEqual(response.json(), { ok: true });
  const cookie = response.cookies.find((entry) => entry.name === MANAGER_SESSION_COOKIE);
  assert.equal(cookie?.value, "");
  assert.equal(cookie?.maxAge, 0);
});

test("dashboard and reports require a session for that store", async () => {
  const app = buildApp({ db: await seededDb() });
  for (const url of ["/api/manager/qr-1/dashboard", "/api/manager/qr-1/reports", "/api/manager/qr-2/dashboard"]) {
    const response = await app.inject({ method: "GET", url, cookies: url.includes("qr-2") ? managerCookie() : {} });
    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), { error: "Manager access is required." });
  }
});

test("dashboard serializes employee statuses", async () => {
  const app = buildApp({ db: await seededDb() });
  const body = (await app.inject({ method: "GET", url: "/api/manager/qr-1/dashboard", cookies: managerCookie() })).json();
  assert.deepEqual(body.store, { id: "store-1", name: "Downtown", qr_token: "qr-1" });
  assert.deepEqual(body.employees.map((entry: { status: string }) => entry.status), ["OUT", "IN"]);
});

test("reports GET returns employees and ISO timelogs", async () => {
  const app = buildApp({ db: await seededDb() });
  const body = (await app.inject({ method: "GET", url: "/api/manager/qr-1/reports", cookies: managerCookie() })).json();
  assert.equal(body.employees.length, 3);
  assert.equal(body.timelogs[0].timestamp, "2026-04-20T08:00:00.000Z");
  assert.equal("pin_hash" in body.store, false);
});

test("reports POST validates payloads and maps errors", async () => {
  const app = buildApp({ db: await seededDb() });
  const invalid = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: { employeeId: "emp-1", clockInLogId: "log-1", clockInAt: "not-a-date", clockOutAt: "2026-04-20T17:00:00Z" },
  });
  assert.equal(invalid.statusCode, 400);
  assert.deepEqual(invalid.json(), { error: "Invalid report correction." });

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
    },
  });
  assert.deepEqual(future.json(), { error: "Only completed shifts can be saved right now." });

  const range = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: { employeeId: "emp-1", clockInLogId: "log-1", clockOutLogId: "log-2", clockInAt: "2026-04-20T10:00:00Z", clockOutAt: "2026-04-20T09:00:00Z" },
  });
  assert.deepEqual(range.json(), { error: "Clock-out must be after clock-in." });
});

test("reports POST saves a correction", async () => {
  const app = buildApp({ db: await seededDb() });
  const response = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: { employeeId: "emp-2", clockInLogId: "log-3", clockOutLogId: null, clockInAt: "2026-04-21T08:00:00Z", clockOutAt: "2026-04-21T15:00:00Z" },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().ok, true);
  assert.equal(typeof response.json().clockOutLogId, "string");
});

test("reports POST rejects corrections for another store's employee", async () => {
  const app = buildApp({ db: await seededDb() });
  const response = await app.inject({
    method: "POST",
    url: "/api/manager/qr-1/reports",
    cookies: managerCookie(),
    payload: { employeeId: "emp-9", clockInLogId: "log-1", clockOutLogId: null, clockInAt: "2026-04-20T08:00:00Z", clockOutAt: "2026-04-20T09:00:00Z" },
  });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), { error: "QRShift couldn't save that report correction. Try again." });
});
