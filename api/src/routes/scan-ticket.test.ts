import assert from "node:assert/strict";
import { test } from "node:test";

import { MANAGER_SESSION_COOKIE, OWNER_SESSION_COOKIE, createManagerSessionValue, createOwnerSessionValue } from "../auth.js";
import { SECRET, displayDb } from "../qr-fixtures.js";
import { TICKET_TTL_MS, WINDOW_MS, signWindow, verifyTicket } from "../qr.js";
import { buildTestApp, seededDb } from "../test-support.js";

const T0 = 100 * WINDOW_MS;

async function setup() {
  let nowMs = T0;
  const app = buildTestApp(await displayDb(), { now: () => nowMs });
  return { app, setNow: (value: number) => (nowMs = value) };
}

const ticketUrl = (token: string, w: unknown, sig: string) => `/api/stores/${token}/scan-ticket?w=${w}&sig=${encodeURIComponent(sig)}`;

test("a fresh QR returns a ticket bound to the store", async () => {
  const { app } = await setup();
  const response = await app.inject({ method: "GET", url: ticketUrl("qr-1", 100, signWindow(SECRET, "store-1", 100)) });
  assert.equal(response.statusCode, 200);
  const { ticket } = response.json();
  assert.equal(ticket.storeId, "store-1");
  assert.equal(ticket.exp, T0 + TICKET_TTL_MS);
  assert.equal(verifyTicket(SECRET, "store-1", ticket, T0), true);
});

test("a QR is accepted until it is 60 s old, then rejected", async () => {
  const { app, setNow } = await setup();
  const url = ticketUrl("qr-1", 100, signWindow(SECRET, "store-1", 100));
  setNow(T0 + 2 * WINDOW_MS - 1);
  assert.equal((await app.inject({ method: "GET", url })).statusCode, 200);
  setNow(T0 + 2 * WINDOW_MS);
  const stale = await app.inject({ method: "GET", url });
  assert.equal(stale.statusCode, 403);
  assert.equal(stale.json().error, "qr_expired");
});

test("tampered, other-store, missing, repeated and non-integer parameters are rejected", async () => {
  const { app } = await setup();
  const good = signWindow(SECRET, "store-1", 100);
  const urls = [
    ticketUrl("qr-1", 100, good + "x"),
    ticketUrl("qr-1", 100, signWindow(SECRET, "store-2", 100)),
    ticketUrl("qr-1", "abc", good),
    ticketUrl("qr-1", "100.5", good),
    ticketUrl("qr-1", "1e2", good),
    "/api/stores/qr-1/scan-ticket",
    "/api/stores/qr-1/scan-ticket?w=100",
    `${ticketUrl("qr-1", 100, good)}&sig=${good}`,
    `${ticketUrl("qr-1", 100, good)}&w=100`,
  ];
  for (const url of urls) {
    const response = await app.inject({ method: "GET", url });
    assert.equal(response.statusCode, 403, url);
    assert.equal(response.json().error, "qr_expired");
  }
});

test("unknown store is 404 and a printed store is 400", async () => {
  const { app } = await setup();
  const missing = await app.inject({ method: "GET", url: ticketUrl("nope", 100, "x") });
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.json().error, "store_not_found");
  const printed = await app.inject({ method: "GET", url: ticketUrl("qr-2", 100, "x") });
  assert.equal(printed.statusCode, 400);
  assert.equal(printed.json().error, "not_display_mode");
});

test("payloads expose qr_mode but never the secret or display key", async () => {
  const { app } = await setup();
  for (const url of ["/api/stores/qr-1", "/api/stores/qr-1/employees"]) {
    const body = (await app.inject({ method: "GET", url })).json();
    assert.equal(body.store.qr_mode, "display");
    assert.doesNotMatch(JSON.stringify(body), /qr_secret|display_key|test-qr-secret|test-display-key/);
  }

  const manager = { [MANAGER_SESSION_COOKIE]: createManagerSessionValue("store-1", "qr-1") };
  const owner = { [OWNER_SESSION_COOKIE]: createOwnerSessionValue() };
  const authed = [
    { url: "/api/manager/qr-1/dashboard", cookies: manager },
    { url: "/api/manager/qr-1/reports", cookies: manager },
    { url: "/api/admin/stores", cookies: owner },
    { url: "/api/admin/stores/store-1/employees", cookies: owner },
  ];
  for (const { url, cookies } of authed) {
    const response = await app.inject({ method: "GET", url, cookies });
    assert.equal(response.statusCode, 200, url);
    assert.doesNotMatch(response.body, /qr_secret|display_key|test-qr-secret|test-display-key/, url);
  }
});

test("existing stores default to printed mode", async () => {
  const app = buildTestApp(await seededDb());
  const body = (await app.inject({ method: "GET", url: "/api/stores/qr-1" })).json();
  assert.equal(body.store.qr_mode, "printed");
});
