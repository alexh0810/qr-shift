import assert from "node:assert/strict";
import { test } from "node:test";

import { eq } from "drizzle-orm";

import { stores } from "../db/schema.js";
import { DISPLAY_KEY, SECRET, displayDb } from "../qr-fixtures.js";
import { issueTicket } from "../qr.js";
import { buildTestApp, seededDb, sessionFor } from "../test-support.js";

const JSON_HEADERS = { "content-type": "application/json" };
const ALICE = "alice@example.com";
const BOB = "bob@example.com";
const CAROL = "carol@example.com";

function call(app: ReturnType<typeof buildTestApp>, method: "GET" | "PUT" | "POST", url: string, payload?: object, who = ALICE) {
  return app.inject({
    method,
    url,
    payload: method === "GET" ? undefined : (payload ?? {}),
    headers: JSON_HEADERS,
    cookies: sessionFor(who),
  });
}

test("only an owner of the store may call the endpoints", async () => {
  const app = buildTestApp(await displayDb());
  const url = "/api/admin/stores/store-1/qr-settings";
  assert.equal((await call(app, "GET", url)).statusCode, 200);
  assert.equal((await call(app, "GET", url, undefined, BOB)).statusCode, 403);
  assert.equal((await call(app, "GET", url, undefined, CAROL)).statusCode, 403);
  assert.equal((await app.inject({ method: "GET", url })).statusCode, 401);
  for (const [method, path] of [["PUT", "qr-mode"], ["PUT", "location"], ["POST", "qr/reissue"], ["POST", "display-key/reset"]] as const) {
    const base = `/api/admin/stores/store-1/${path}`;
    assert.equal((await call(app, method, base, { qr_mode: "display" }, BOB)).statusCode, 403, `manager ${path}`);
    assert.equal((await call(app, method, base, { qr_mode: "display" }, CAROL)).statusCode, 403, `other owner ${path}`);
    const anonymous = await app.inject({ method, url: base, payload: {}, headers: JSON_HEADERS });
    assert.equal(anonymous.statusCode, 401, `anonymous ${path}`);
  }
});

test("settings expose the display key to owners but never the secret", async () => {
  const app = buildTestApp(await displayDb());
  const settings = (await call(app, "GET", "/api/admin/stores/store-1/qr-settings")).json();
  assert.equal(settings.display_key, DISPLAY_KEY);
  assert.equal(settings.has_location, false);
  assert.ok(!JSON.stringify(settings).includes(SECRET));
});

test("enabling display mode creates a secret and key once and is idempotent", async () => {
  const db = await seededDb();
  const app = buildTestApp(db);
  const first = await call(app, "PUT", "/api/admin/stores/store-1/qr-mode", { qr_mode: "display" });
  assert.equal(first.statusCode, 200);
  const settings = first.json();
  assert.equal(settings.qr_mode, "display");
  assert.ok(settings.display_key.length >= 43);
  const [row] = await db.select().from(stores).where(eq(stores.id, "store-1"));
  assert.ok(row.qr_secret);
  const second = (await call(app, "PUT", "/api/admin/stores/store-1/qr-mode", { qr_mode: "display" })).json();
  assert.equal(second.display_key, settings.display_key);
  const [again] = await db.select().from(stores).where(eq(stores.id, "store-1"));
  assert.equal(again.qr_secret, row.qr_secret);
});

test("switching back to printed hides the display key and keeps the printed QR working", async () => {
  const app = buildTestApp(await displayDb());
  const settings = (await call(app, "PUT", "/api/admin/stores/store-1/qr-mode", { qr_mode: "printed" })).json();
  assert.equal(settings.qr_mode, "printed");
  assert.equal(settings.display_key, null);
  const clock = await app.inject({ method: "POST", url: "/api/stores/qr-1/clock", headers: JSON_HEADERS, payload: { employeeId: "emp-1", requestedAction: "IN" } });
  assert.equal(clock.statusCode, 200);
});

test("invalid mode is rejected", async () => {
  const app = buildTestApp(await displayDb());
  for (const payload of [{ qr_mode: "wifi" }, {}]) {
    const bad = await call(app, "PUT", "/api/admin/stores/store-1/qr-mode", payload);
    assert.equal(bad.statusCode, 400);
    assert.equal(bad.json().error, "invalid_qr_mode");
  }
});

test("an unknown store is a 403 from requireRole", async () => {
  const app = buildTestApp(await displayDb());
  assert.equal((await call(app, "GET", "/api/admin/stores/nope/qr-settings")).statusCode, 403);
});

test("location validation and storage", async () => {
  const app = buildTestApp(await displayDb());
  const invalid = [
    { lat: 91, lng: 0 },
    { lat: 0, lng: 181 },
    { lat: "1", lng: 0 },
    { lat: 1, lng: null },
    { lat: 1, lng: 2, radius_m: 10 },
    { lat: 1, lng: 2, radius_m: 5000 },
    { lat: 1, lng: 2, radius_m: 100.5 },
    { lat: 1, lng: 2, radius_m: "100" },
    {},
  ];
  for (const payload of invalid) {
    const response = await call(app, "PUT", "/api/admin/stores/store-1/location", payload);
    assert.equal(response.statusCode, 400, JSON.stringify(payload));
    assert.equal(response.json().error, "invalid_location");
  }
  const ok = await call(app, "PUT", "/api/admin/stores/store-1/location", { lat: 60.1699, lng: 24.9384, radius_m: 200 });
  assert.equal(ok.statusCode, 200);
  assert.deepEqual([ok.json().lat, ok.json().lng, ok.json().radius_m, ok.json().has_location], [60.1699, 24.9384, 200, true]);
  const keepRadius = await call(app, "PUT", "/api/admin/stores/store-1/location", { lat: 1, lng: 2 });
  assert.equal(keepRadius.json().radius_m, 200);
  const cleared = (await call(app, "PUT", "/api/admin/stores/store-1/location", { lat: null, lng: null })).json();
  assert.equal(cleared.has_location, false);
  assert.equal(cleared.lat, null);
});

test("reissue replaces the secret and kills outstanding tickets", async () => {
  const app = buildTestApp(await displayDb());
  const oldTicket = issueTicket(SECRET, "store-1", Date.now());
  const clock = (requestedAction: string) =>
    app.inject({ method: "POST", url: "/api/stores/qr-1/clock", headers: JSON_HEADERS, payload: { employeeId: "emp-1", requestedAction, ticket: oldTicket } });
  assert.equal((await clock("IN")).statusCode, 200);
  assert.equal((await call(app, "POST", "/api/admin/stores/store-1/qr/reissue")).statusCode, 200);
  assert.equal((await clock("OUT")).statusCode, 403);
});

test("resetting the display key cuts the old link", async () => {
  const app = buildTestApp(await displayDb());
  const reset = await call(app, "POST", "/api/admin/stores/store-1/display-key/reset");
  assert.equal(reset.statusCode, 200);
  assert.notEqual(reset.json().display_key, DISPLAY_KEY);
  const link = (key: string) => app.inject({ method: "GET", url: "/api/display/store-1/qr", headers: { "x-display-key": key } });
  assert.equal((await link(DISPLAY_KEY)).statusCode, 401);
  assert.equal((await link(reset.json().display_key)).statusCode, 200);
});

test("resetting the key of a printed store is rejected", async () => {
  const app = buildTestApp(await seededDb());
  const response = await call(app, "POST", "/api/admin/stores/store-1/display-key/reset");
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, "not_display_mode");
});
