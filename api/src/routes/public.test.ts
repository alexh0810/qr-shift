import assert from "node:assert/strict";
import { test } from "node:test";

import { buildApp } from "../app.js";
import { seededDb } from "../test-support.js";

test("public store route returns 404 for unknown qr tokens", async () => {
  const app = buildApp({ db: await seededDb() });
  const response = await app.inject({ method: "GET", url: "/api/stores/missing" });
  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), { error: "Store not found." });
});

test("public store route returns the scan-safe store payload", async () => {
  const app = buildApp({ db: await seededDb() });
  const response = await app.inject({ method: "GET", url: "/api/stores/qr-1" });
  assert.deepEqual(response.json(), { store: { id: "store-1", name: "Downtown", qr_token: "qr-1" } });
});

test("scan roster returns 404 for unknown qr tokens", async () => {
  const app = buildApp({ db: await seededDb() });
  const response = await app.inject({ method: "GET", url: "/api/stores/missing/employees" });
  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), { error: "Store not found." });
});

test("scan roster serializes employees, latest logs and statuses", async () => {
  const app = buildApp({ db: await seededDb() });
  const body = (await app.inject({ method: "GET", url: "/api/stores/qr-1/employees" })).json();
  assert.equal(body.employees.length, 2);
  assert.deepEqual(body.employees[1], {
    employee: { id: "emp-2", store_id: "store-1", name: "Kim", status: "active", created_at: "2026-04-01T00:00:00.000Z" },
    latest_log: { id: "log-3", employee_id: "emp-2", store_id: "store-1", type: "IN", timestamp: "2026-04-21T08:00:00.000Z" },
    status: "IN",
  });
});

test("clock route rejects invalid bodies", async () => {
  const app = buildApp({ db: await seededDb() });
  for (const payload of ['{"employeeId":"emp-1","requestedAction":"LUNCH"}', "{not json"]) {
    const response = await app.inject({
      method: "POST",
      url: "/api/stores/qr-1/clock",
      headers: { "content-type": "application/json" },
      payload,
    });
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { error: "Choose an employee and confirm the next action." });
  }
});

test("clock route maps invalid transitions to customer-safe copy", async () => {
  const app = buildApp({ db: await seededDb() });
  const response = await app.inject({
    method: "POST",
    url: "/api/stores/qr-1/clock",
    payload: { employeeId: "emp-2", requestedAction: "IN" },
  });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), { error: "This shift status changed. Go back and try again." });
});

test("clock route maps other failures to the generic message", async () => {
  const app = buildApp({ db: await seededDb() });
  const response = await app.inject({
    method: "POST",
    url: "/api/stores/qr-1/clock",
    payload: { employeeId: "nobody", requestedAction: "IN" },
  });
  assert.deepEqual(response.json(), { error: "QRShift couldn't save that clock action. Try again." });
});

test("clock route returns the action and timestamp, and the roster reflects it", async () => {
  const app = buildApp({ db: await seededDb() });
  const response = await app.inject({
    method: "POST",
    url: "/api/stores/qr-1/clock",
    payload: { employeeId: " emp-1 ", requestedAction: "IN" },
  });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.action, "IN");
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)));

  const roster = (await app.inject({ method: "GET", url: "/api/stores/qr-1/employees" })).json();
  assert.equal(roster.employees[0].status, "IN");
});
