import assert from "node:assert/strict";
import { test } from "node:test";

import { eq } from "drizzle-orm";

import { buildApp } from "../app.js";
import { stores } from "../db/schema.js";
import { SECRET, displayDb } from "../qr-fixtures.js";
import { TICKET_TTL_MS, WINDOW_MS, issueTicket } from "../qr.js";

const T0 = 100 * WINDOW_MS;

async function setup() {
  let nowMs = T0;
  const db = await displayDb();
  const app = buildApp({ db, now: () => nowMs });
  const clock = (qr: string, payload: object) =>
    app.inject({ method: "POST", url: `/api/stores/${qr}/clock`, headers: { "content-type": "application/json" }, payload });
  return { app, db, clock, setNow: (value: number) => (nowMs = value) };
}

const body = { employeeId: "emp-1", requestedAction: "IN" };

test("display mode without a ticket is rejected and nothing is written", async () => {
  const { app, clock } = await setup();
  const response = await clock("qr-1", body);
  assert.equal(response.statusCode, 403);
  assert.equal(response.json().error, "qr_required");
  const roster = (await app.inject({ method: "GET", url: "/api/stores/qr-1/employees" })).json();
  assert.equal(roster.employees[0].status, "OUT");
});

test("a valid ticket clocks in at the server time", async () => {
  const { clock } = await setup();
  const response = await clock("qr-1", { ...body, ticket: issueTicket(SECRET, "store-1", T0) });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().timestamp, new Date(T0).toISOString());
});

test("a ticket works for 120 s, not a millisecond longer", async () => {
  const { clock, setNow } = await setup();
  const ticket = issueTicket(SECRET, "store-1", T0);
  setNow(T0 + TICKET_TTL_MS - 1);
  assert.equal((await clock("qr-1", { ...body, ticket })).statusCode, 200);
  setNow(T0 + TICKET_TTL_MS);
  const expired = await clock("qr-1", { employeeId: "emp-1", requestedAction: "OUT", ticket });
  assert.equal(expired.statusCode, 403);
  assert.equal(expired.json().error, "qr_expired");
});

test("tickets from another store, tampered tickets and garbage are rejected", async () => {
  const { clock } = await setup();
  const own = issueTicket(SECRET, "store-1", T0);
  const attempts = [
    issueTicket("other-secret", "store-2", T0),
    { ...own, mac: own.mac.slice(0, -1) + (own.mac.endsWith("A") ? "B" : "A") },
    { ...own, exp: own.exp + 1 },
    "ticket",
    {},
  ];
  for (const ticket of attempts) {
    const response = await clock("qr-1", { ...body, ticket });
    assert.equal(response.statusCode, 403, JSON.stringify(ticket));
    assert.equal(response.json().error, "qr_expired");
  }
});

test("a display store without a secret rejects every ticket", async () => {
  const { db, clock } = await setup();
  await db.update(stores).set({ qr_secret: null }).where(eq(stores.id, "store-1"));
  const response = await clock("qr-1", { ...body, ticket: issueTicket("", "store-1", T0) });
  assert.equal(response.statusCode, 403);
});

test("printed stores still clock in without a ticket", async () => {
  const { clock } = await setup();
  const response = await clock("qr-2", { employeeId: "emp-9", requestedAction: "IN" });
  assert.equal(response.statusCode, 200);
});

test("invalid bodies still get the legacy 400 before the ticket check", async () => {
  const { clock } = await setup();
  const response = await clock("qr-1", { employeeId: "emp-1", requestedAction: "LUNCH" });
  assert.equal(response.statusCode, 400);
});
