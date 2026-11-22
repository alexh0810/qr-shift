import assert from "node:assert/strict";
import { test } from "node:test";

import type { Db } from "../db/client.js";
import { buildTestApp, seededDb, sessionFor } from "../test-support.js";

const ownerCookie = () => sessionFor("alice@example.com");
const managerCookie = () => sessionFor("bob@example.com");

test("owner routes reject anonymous callers, managers and other stores' owners", async () => {
  const app = buildTestApp(await seededDb());
  const requests = [
    { method: "GET" as const, url: "/api/admin/stores/store-1/employees" },
    { method: "POST" as const, url: "/api/admin/stores/store-1/employees", payload: { name: "Dana" } },
    { method: "PATCH" as const, url: "/api/admin/stores/store-1/employees/emp-1", payload: { status: "archived" } },
    { method: "GET" as const, url: "/api/admin/stores/store-1/members" },
    { method: "POST" as const, url: "/api/admin/stores/store-1/members", payload: { email: "x@example.com" } },
    { method: "DELETE" as const, url: "/api/admin/stores/store-1/members/bob%40example.com" },
  ];
  for (const request of requests) {
    const anonymous = await app.inject(request);
    assert.deepEqual([anonymous.statusCode, anonymous.json().error], [401, "unauthenticated"], request.url);
    const manager = await app.inject({ ...request, cookies: managerCookie() });
    assert.deepEqual([manager.statusCode, manager.json().error], [403, "forbidden"], request.url);
    const otherOwner = await app.inject({ ...request, cookies: sessionFor("carol@example.com") });
    assert.equal(otherOwner.statusCode, 403, request.url);
  }
  for (const request of [
    { method: "GET" as const, url: "/api/admin/stores" },
    { method: "POST" as const, url: "/api/admin/stores", payload: {} },
    { method: "POST" as const, url: "/api/admin/demo-store" },
  ]) {
    assert.equal((await app.inject(request)).statusCode, 401, request.url);
  }
});

test("lists only the caller's owned stores newest first with ISO timestamps", async () => {
  const app = buildTestApp(await seededDb());
  const mine = (await app.inject({ method: "GET", url: "/api/admin/stores", cookies: ownerCookie() })).json();
  assert.deepEqual(mine.stores[0], { id: "store-2", name: "Midtown", qr_token: "qr-2", qr_mode: "printed", created_at: "2026-04-10T00:00:00.000Z" });
  assert.equal(mine.stores.length, 2);

  const carol = (await app.inject({ method: "GET", url: "/api/admin/stores", cookies: sessionFor("carol@example.com") })).json();
  assert.deepEqual(carol.stores.map((store: { id: string }) => store.id), ["store-2"]);

  const manager = (await app.inject({ method: "GET", url: "/api/admin/stores", cookies: managerCookie() })).json();
  assert.deepEqual(manager.stores, []);
});

test("any signed-in user creates a store and becomes its owner", async () => {
  const app = buildTestApp(await seededDb());
  const dave = sessionFor("Dave@Example.com");
  const missing = await app.inject({ method: "POST", url: "/api/admin/stores", cookies: dave, payload: { storeName: "Cafe", employeeNames: [] } });
  assert.deepEqual(missing.json(), { error: "invalid_request", message: "Add a store name and at least one employee." });

  const created = await app.inject({ method: "POST", url: "/api/admin/stores", cookies: dave, payload: { storeName: "Cafe", employeeNames: ["Ana"] } });
  assert.equal(created.statusCode, 200);
  assert.equal(created.json().qrToken.length, 16);

  const mine = (await app.inject({ method: "GET", url: "/api/admin/stores", cookies: dave })).json();
  assert.deepEqual(mine.stores.map((store: { name: string }) => store.name), ["Cafe"]);
  const roster = await app.inject({ method: "GET", url: `/api/admin/stores/${created.json().storeId}/employees`, cookies: dave });
  assert.equal(roster.statusCode, 200);
});

test("members: owners add, list and remove managers", async () => {
  const app = buildTestApp(await seededDb());
  const owner = ownerCookie();
  const bad = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/members", cookies: owner, payload: { email: "nope" } });
  assert.deepEqual([bad.statusCode, bad.json()], [400, { error: "invalid_email", message: "Enter a valid email address." }]);

  const added = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/members", cookies: owner, payload: { email: " Eve@Example.com " } });
  assert.deepEqual(added.json(), { member: { email: "eve@example.com", role: "manager" } });
  const duplicate = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/members", cookies: owner, payload: { email: "eve@example.com" } });
  assert.deepEqual([duplicate.statusCode, duplicate.json().error], [400, "already_member"]);

  const eve = await app.inject({ method: "GET", url: "/api/manager/qr-1/dashboard", cookies: sessionFor("eve@example.com") });
  assert.equal(eve.statusCode, 200);

  const list = (await app.inject({ method: "GET", url: "/api/admin/stores/store-1/members", cookies: owner })).json();
  assert.deepEqual(list.members, [
    { email: "alice@example.com", role: "owner" },
    { email: "bob@example.com", role: "manager" },
    { email: "eve@example.com", role: "manager" },
  ]);

  const removed = await app.inject({ method: "DELETE", url: "/api/admin/stores/store-1/members/eve%40example.com", cookies: owner });
  assert.deepEqual(removed.json(), { ok: true });
  const gone = await app.inject({ method: "GET", url: "/api/manager/qr-1/dashboard", cookies: sessionFor("eve@example.com") });
  assert.equal(gone.statusCode, 403);

  const missing = await app.inject({ method: "DELETE", url: "/api/admin/stores/store-1/members/eve%40example.com", cookies: owner });
  assert.deepEqual([missing.statusCode, missing.json().error], [404, "member_not_found"]);
  const lastOwner = await app.inject({ method: "DELETE", url: "/api/admin/stores/store-1/members/alice%40example.com", cookies: owner });
  assert.deepEqual([lastOwner.statusCode, lastOwner.json()], [400, { error: "cannot_remove_owner", message: "Owners can't be removed." }]);
});

test("members: adding an owner's email is refused and the role stays; owners cannot remove themselves", async () => {
  const app = buildTestApp(await seededDb());
  const owner = ownerCookie();
  const added = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/members", cookies: owner, payload: { email: "Alice@Example.com" } });
  assert.deepEqual([added.statusCode, added.json().error], [400, "already_member"]);
  const list = (await app.inject({ method: "GET", url: "/api/admin/stores/store-1/members", cookies: owner })).json();
  assert.deepEqual(list.members[0], { email: "alice@example.com", role: "owner" });

  const self = await app.inject({ method: "DELETE", url: "/api/admin/stores/store-1/members/alice%40example.com", cookies: owner });
  assert.deepEqual([self.statusCode, self.json().error], [400, "cannot_remove_owner"]);
  const still = await app.inject({ method: "GET", url: "/api/admin/stores/store-1/members", cookies: owner });
  assert.equal(still.statusCode, 200);
});

test("roster GET returns 403 for unknown stores and includes archived staff", async () => {
  const app = buildTestApp(await seededDb());
  const missing = await app.inject({ method: "GET", url: "/api/admin/stores/missing/employees", cookies: ownerCookie() });
  assert.deepEqual([missing.statusCode, missing.json().error], [403, "forbidden"]);

  const body = (await app.inject({ method: "GET", url: "/api/admin/stores/store-1/employees", cookies: ownerCookie() })).json();
  assert.equal(body.store.created_at, "2026-04-01T00:00:00.000Z");
  assert.deepEqual(body.employees.map((employee: { name: string }) => employee.name), ["Alex", "Kim", "Bea"]);
});

test("roster POST creates employees and maps duplicates", async () => {
  const app = buildTestApp(await seededDb());
  const created = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/employees", cookies: ownerCookie(), payload: { name: "Dana" } });
  assert.equal(created.json().employee.status, "active");

  const duplicate = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/employees", cookies: ownerCookie(), payload: { name: "alex" } });
  assert.deepEqual([duplicate.statusCode, duplicate.json()], [400, { error: "duplicate_employee_name", message: "An employee with that name already exists for this store." }]);

  const empty = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/employees", cookies: ownerCookie(), payload: { name: " " } });
  assert.deepEqual(empty.json(), { error: "invalid_employee_name", message: "Enter an employee name." });

  const missing = await app.inject({ method: "POST", url: "/api/admin/stores/missing/employees", cookies: ownerCookie(), payload: { name: "Eve" } });
  assert.deepEqual([missing.statusCode, missing.json().error], [403, "forbidden"]);
});

test("employee PATCH updates status and maps errors", async () => {
  const app = buildTestApp(await seededDb());
  const archived = await app.inject({ method: "PATCH", url: "/api/admin/stores/store-1/employees/emp-2", cookies: ownerCookie(), payload: { status: "archived" } });
  assert.equal(archived.json().employee.status, "archived");

  const foreign = await app.inject({ method: "PATCH", url: "/api/admin/stores/store-1/employees/emp-9", cookies: ownerCookie(), payload: { status: "archived" } });
  assert.deepEqual([foreign.statusCode, foreign.json()], [400, { error: "employee_store_mismatch", message: "This employee does not belong to the selected store." }]);

  const missing = await app.inject({ method: "PATCH", url: "/api/admin/stores/store-1/employees/nobody", cookies: ownerCookie(), payload: { status: "archived" } });
  assert.deepEqual([missing.statusCode, missing.json()], [404, { error: "employee_not_found", message: "Employee not found." }]);

  const noChange = await app.inject({ method: "PATCH", url: "/api/admin/stores/store-1/employees/emp-1", cookies: ownerCookie(), payload: {} });
  assert.deepEqual(noChange.json(), { error: "no_employee_changes", message: "No employee changes were provided." });
});

test("unexpected employee failures fall back to the generic codes", async () => {
  const real = await seededDb();
  const failing = new Proxy(real, {
    get: (target, key) => (key === "insert" || key === "update" ? () => { throw new Error("boom"); } : Reflect.get(target, key)),
  });
  const app = buildTestApp(failing as Db);
  const created = await app.inject({ method: "POST", url: "/api/admin/stores/store-1/employees", cookies: ownerCookie(), payload: { name: "Dana" } });
  assert.deepEqual([created.statusCode, created.json()], [400, { error: "employee_create_failed", message: "QRShift couldn't add that employee. Try again." }]);

  const updated = await app.inject({ method: "PATCH", url: "/api/admin/stores/store-1/employees/emp-1", cookies: ownerCookie(), payload: { status: "archived" } });
  assert.deepEqual([updated.statusCode, updated.json()], [400, { error: "employee_update_failed", message: "QRShift couldn't update that employee. Try again." }]);
});

test("demo store creation makes the caller its owner", async () => {
  const app = buildTestApp(await seededDb());
  const dave = sessionFor("dave@example.com");
  const body = (await app.inject({ method: "POST", url: "/api/admin/demo-store", cookies: dave })).json();
  assert.equal(body.storeName, "Demo Payroll Store");
  assert.equal("pin" in body, false);
  const mine = (await app.inject({ method: "GET", url: "/api/admin/stores", cookies: dave })).json();
  assert.equal(mine.stores.length, 1);
});
