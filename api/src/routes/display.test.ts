import assert from "node:assert/strict";
import { test } from "node:test";

import { eq } from "drizzle-orm";

import { stores } from "../db/schema.js";
import { DISPLAY_KEY, SECRET, displayDb } from "../qr-fixtures.js";
import { WINDOW_MS, signWindow } from "../qr.js";
import { buildTestApp } from "../test-support.js";

const T0 = 100 * WINDOW_MS;

async function setup() {
  let nowMs = T0;
  const app = buildTestApp(await displayDb(), { now: () => nowMs });
  const qr = (storeId: string, key?: string) =>
    app.inject({ method: "GET", url: `/api/display/${storeId}/qr`, headers: key ? { "x-display-key": key } : {} });
  return { app, qr, setNow: (value: number) => (nowMs = value) };
}

test("a valid key returns the signed current window and nothing secret", async () => {
  const { qr } = await setup();
  const response = await qr("store-1", DISPLAY_KEY);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.deepEqual(response.json(), {
    store_name: "Downtown",
    qr_token: "qr-1",
    window: 100,
    sig: signWindow(SECRET, "store-1", 100),
    refresh_in_ms: WINDOW_MS,
  });
  assert.ok(!response.body.includes(SECRET) && !response.body.includes(DISPLAY_KEY));
});

test("refresh_in_ms counts down to the next window", async () => {
  const { qr, setNow } = await setup();
  setNow(T0 + 10_000);
  assert.equal((await qr("store-1", DISPLAY_KEY)).json().refresh_in_ms, 20_000);
});

test("missing, wrong, other-store, unknown-store and printed-store requests all get the same 401", async () => {
  const { qr } = await setup();
  const attempts = [qr("store-1"), qr("store-1", "wrong"), qr("store-1", DISPLAY_KEY + "x"), qr("store-2", DISPLAY_KEY), qr("nope", DISPLAY_KEY)];
  for (const response of await Promise.all(attempts)) {
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error, "invalid_display_key");
  }
});

test("a display-mode store without a secret or key is rejected", async () => {
  for (const column of ["qr_secret", "display_key"] as const) {
    const db = await displayDb();
    await db.update(stores).set({ [column]: null }).where(eq(stores.id, "store-1"));
    const app = buildTestApp(db, { now: () => T0 });
    const response = await app.inject({ method: "GET", url: "/api/display/store-1/qr", headers: { "x-display-key": DISPLAY_KEY } });
    assert.equal(response.statusCode, 401);
  }
});

test("the last millisecond of a window refreshes in 1 ms", async () => {
  const { qr, setNow } = await setup();
  setNow(T0 + WINDOW_MS - 1);
  assert.equal((await qr("store-1", DISPLAY_KEY)).json().refresh_in_ms, 1);
});

test("a repeated key header is rejected", async () => {
  const { app } = await setup();
  const response = await app.inject({
    method: "GET",
    url: "/api/display/store-1/qr",
    headers: { "x-display-key": [DISPLAY_KEY, DISPLAY_KEY] },
  });
  assert.equal(response.statusCode, 401);
});

test("the display key grants nothing on other endpoints", async () => {
  const { app } = await setup();
  const clock = await app.inject({
    method: "POST",
    url: "/api/stores/qr-1/clock",
    headers: { "x-display-key": DISPLAY_KEY, "content-type": "application/json" },
    payload: { employeeId: "emp-1", requestedAction: "IN" },
  });
  assert.equal(clock.statusCode, 403);
});

test("the display QR round-trips through scan-ticket and clock", async () => {
  const { app, qr } = await setup();
  const shown = (await qr("store-1", DISPLAY_KEY)).json();
  const ticketResponse = await app.inject({ method: "GET", url: `/api/stores/${shown.qr_token}/scan-ticket?w=${shown.window}&sig=${shown.sig}` });
  assert.equal(ticketResponse.statusCode, 200);
  const clock = await app.inject({
    method: "POST",
    url: "/api/stores/qr-1/clock",
    headers: { "content-type": "application/json" },
    payload: { employeeId: "emp-1", requestedAction: "IN", ticket: ticketResponse.json().ticket },
  });
  assert.equal(clock.statusCode, 200);
});
