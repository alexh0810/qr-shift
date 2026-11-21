import assert from "node:assert/strict";
import { test } from "node:test";

import { desc, eq } from "drizzle-orm";

import { stores, timelogs } from "../db/schema.js";
import { SECRET, displayDb } from "../qr-fixtures.js";
import { WINDOW_MS, issueTicket } from "../qr.js";
import { buildTestApp } from "../test-support.js";

const T0 = 100 * WINDOW_MS;
const HOME = { lat: 60.1699, lng: 24.9384 };

async function setup() {
  const db = await displayDb();
  await db.update(stores).set({ ...HOME }).where(eq(stores.id, "store-2"));
  await db.update(stores).set({ ...HOME }).where(eq(stores.id, "store-1"));
  let tick = 0;
  const app = buildTestApp(db, { now: () => T0 + 1000 * tick++ });
  const clock = (qr: string, payload: object) =>
    app.inject({ method: "POST", url: `/api/stores/${qr}/clock`, headers: { "content-type": "application/json" }, payload });
  const lastStatus = async (employeeId: string) =>
    (await db.select().from(timelogs).where(eq(timelogs.employee_id, employeeId)).orderBy(desc(timelogs.timestamp))).at(0)?.location_status;
  return { app, db, clock, lastStatus };
}

const sam = { employeeId: "emp-9", requestedAction: "IN" };

test("printed mode stores inside / outside / unknown from the posted location", async () => {
  const { clock, lastStatus } = await setup();
  assert.equal((await clock("qr-2", { ...sam, location: { ...HOME, accuracy: 10 } })).statusCode, 200);
  assert.equal(await lastStatus("emp-9"), "inside");

  await clock("qr-2", { employeeId: "emp-9", requestedAction: "OUT", location: { lat: HOME.lat + 0.01, lng: HOME.lng, accuracy: 10 } });
  assert.equal(await lastStatus("emp-9"), "outside");

  await clock("qr-2", sam);
  assert.equal(await lastStatus("emp-9"), "unknown");

  await clock("qr-2", { employeeId: "emp-9", requestedAction: "OUT", location: { ...HOME, accuracy: 250 } });
  assert.equal(await lastStatus("emp-9"), "unknown");
});

test("a clock-in is never blocked by an outside or garbage location", async () => {
  const { clock } = await setup();
  const response = await clock("qr-2", { ...sam, location: "nonsense" });
  assert.equal(response.statusCode, 200);
});

test("a printed store without coordinates stores no status", async () => {
  const { db, clock, lastStatus } = await setup();
  await db.update(stores).set({ lat: null, lng: null }).where(eq(stores.id, "store-2"));
  await clock("qr-2", { ...sam, location: { ...HOME, accuracy: 5 } });
  assert.equal(await lastStatus("emp-9"), null);
});

test("display mode never stores a status", async () => {
  const { clock, lastStatus } = await setup();
  const response = await clock("qr-1", {
    employeeId: "emp-1",
    requestedAction: "IN",
    ticket: issueTicket(SECRET, "store-1", T0),
    location: { lat: 0, lng: 0, accuracy: 5 },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(await lastStatus("emp-1"), null);
});

test("neither the clock response nor the public roster exposes the status", async () => {
  const { app, clock } = await setup();
  const response = await clock("qr-2", { ...sam, location: { ...HOME, accuracy: 10 } });
  assert.ok(!("location_status" in response.json()));
  const roster = (await app.inject({ method: "GET", url: "/api/stores/qr-2/employees" })).json();
  assert.ok(!("location_status" in roster.employees[0].latest_log));
});
