import assert from "node:assert/strict";
import { test } from "node:test";

import { buildApp } from "../app.js";
import { OWNER_SESSION_COOKIE, createOwnerSessionValue } from "../auth.js";
import { seededDb } from "../test-support.js";

const ownerCookie = () => ({ [OWNER_SESSION_COOKIE]: createOwnerSessionValue() });

test("owner login validates the secret and sets a cookie", async () => {
  const app = buildApp({ db: await seededDb() });
  const empty = await app.inject({ method: "POST", url: "/api/admin/session", payload: {} });
  assert.deepEqual([empty.statusCode, empty.json()], [400, { error: "Enter the owner secret to continue." }]);

  const wrong = await app.inject({ method: "POST", url: "/api/admin/session", payload: { secret: "nope" } });
  assert.deepEqual([wrong.statusCode, wrong.json()], [401, { error: "Incorrect owner secret. Please try again." }]);

  const ok = await app.inject({ method: "POST", url: "/api/admin/session", payload: { secret: " test-owner-secret " } });
  assert.deepEqual(ok.json(), { ok: true });
  const cookie = ok.cookies.find((entry) => entry.name === OWNER_SESSION_COOKIE);
  const status = await app.inject({ method: "GET", url: "/api/admin/session", cookies: { [OWNER_SESSION_COOKIE]: cookie!.value } });
  assert.deepEqual(status.json(), { authenticated: true });

  const logout = await app.inject({ method: "DELETE", url: "/api/admin/session" });
  assert.equal(logout.cookies.find((entry) => entry.name === OWNER_SESSION_COOKIE)?.maxAge, 0);
});

test("owner routes reject requests without an owner session", async () => {
  const app = buildApp({ db: await seededDb() });
  const requests = [
    { method: "GET" as const, url: "/api/admin/stores" },
    { method: "POST" as const, url: "/api/admin/stores", payload: {} },
    { method: "GET" as const, url: "/api/admin/stores/store-1/employees" },
    { method: "POST" as const, url: "/api/admin/stores/store-1/employees", payload: { name: "Dana" } },
    { method: "PATCH" as const, url: "/api/admin/stores/store-1/employees/emp-1", payload: { status: "archived" } },
    { method: "POST" as const, url: "/api/admin/demo-store" },
  ];
  for (const request of requests) {
    const response = await app.inject(request);
    assert.equal(response.statusCode, 401, request.url);
    assert.deepEqual(response.json(), { error: "Owner access is required." });
  }
});

test("lists stores newest first with ISO timestamps", async () => {
  const app = buildApp({ db: await seededDb() });
  const body = (await app.inject({ method: "GET", url: "/api/admin/stores", cookies: ownerCookie() })).json();
  assert.deepEqual(body.stores[0], { id: "store-2", name: "Midtown", qr_token: "qr-2", created_at: "2026-04-10T00:00:00.000Z" });
});

test("creates a store after validating name, PIN and employees", async () => {
  const app = buildApp({ db: await seededDb() });
  const missing = await app.inject({ method: "POST", url: "/api/admin/stores", cookies: ownerCookie(), payload: { storeName: "Cafe", pin: "1234", employeeNames: [] } });
  assert.deepEqual(missing.json(), { error: "Add a store name, manager PIN, and at least one employee." });

  const badPin = await app.inject({ method: "POST", url: "/api/admin/stores", cookies: ownerCookie(), payload: { storeName: "Cafe", pin: "12a", employeeNames: ["Ana"] } });
  assert.deepEqual(badPin.json(), { error: "Manager PIN must be numeric and 6 digits or fewer." });

  const created = await app.inject({ method: "POST", url: "/api/admin/stores", cookies: ownerCookie(), payload: { storeName: "Cafe", pin: "1234", employeeNames: ["Ana"] } });
  assert.equal(created.statusCode, 200);
  assert.equal(created.json().storeName, "Cafe");
  assert.equal(created.json().qrToken.length, 16);
});

test("roster GET returns 404 for unknown stores and includes archived staff", async () => {
  const app = buildApp({ db: await seededDb() });
  const missing = await app.inject({ method: "GET", url: "/api/admin/stores/missing/employees", cookies: ownerCookie() });
  assert.deepEqual([missing.statusCode, missing.json()], [404, { error: "Store not found." }]);

  const body = (await app.inject({ method: "GET", url: "/api/admin/stores/store-1/employees", cookies: ownerCookie() })).json();
  assert.equal(body.store.created_at, "2026-04-01T00:00:00.000Z");
  assert.deepEqual(body.employees.map((employee: { name: string }) => employee.name), ["Alex", "Kim", "Bea"]);
});

test("roster POST creates employees and maps duplicates", async () => {
  const app = buildApp({ db: await seededDb() });
  const created = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/employees", cookies: ownerCookie(), payload: { name: "Dana" } });
  assert.equal(created.json().employee.status, "active");

  const duplicate = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/employees", cookies: ownerCookie(), payload: { name: "alex" } });
  assert.deepEqual([duplicate.statusCode, duplicate.json()], [400, { error: "An employee with that name already exists for this store." }]);

  const empty = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/employees", cookies: ownerCookie(), payload: { name: " " } });
  assert.deepEqual(empty.json(), { error: "Enter an employee name." });

  const missing = await app.inject({ method: "POST", url: "/api/admin/stores/missing/employees", cookies: ownerCookie(), payload: { name: "Eve" } });
  assert.deepEqual([missing.statusCode, missing.json()], [404, { error: "Store not found." }]);
});

test("employee PATCH updates status and maps errors", async () => {
  const app = buildApp({ db: await seededDb() });
  const archived = await app.inject({ method: "PATCH", url: "/api/admin/stores/store-1/employees/emp-2", cookies: ownerCookie(), payload: { status: "archived" } });
  assert.equal(archived.json().employee.status, "archived");

  const foreign = await app.inject({ method: "PATCH", url: "/api/admin/stores/store-1/employees/emp-9", cookies: ownerCookie(), payload: { status: "archived" } });
  assert.deepEqual([foreign.statusCode, foreign.json()], [400, { error: "This employee does not belong to the selected store." }]);

  const missing = await app.inject({ method: "PATCH", url: "/api/admin/stores/store-1/employees/nobody", cookies: ownerCookie(), payload: { status: "archived" } });
  assert.deepEqual([missing.statusCode, missing.json()], [404, { error: "Employee not found." }]);

  const noChange = await app.inject({ method: "PATCH", url: "/api/admin/stores/store-1/employees/emp-1", cookies: ownerCookie(), payload: {} });
  assert.deepEqual(noChange.json(), { error: "No employee changes were provided." });
});

test("demo store creation returns its PIN and qr token", async () => {
  const app = buildApp({ db: await seededDb() });
  const body = (await app.inject({ method: "POST", url: "/api/admin/demo-store", cookies: ownerCookie() })).json();
  assert.equal(body.storeName, "Demo Payroll Store");
  assert.equal(body.pin, "1234");
});
