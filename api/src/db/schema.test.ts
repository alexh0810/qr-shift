import assert from "node:assert/strict";
import { test } from "node:test";

import { createTestDb } from "./test-db.js";
import { employees, stores, timelogs } from "./schema.js";

async function seeded() {
  const db = await createTestDb();
  await db.insert(stores).values({ id: "s1", name: "Cafe", qr_token: "qr-1" });
  await db.insert(employees).values({ id: "e1", store_id: "s1", name: "Ana" });
  return db;
}

test("stores, employees and timelogs round-trip", async () => {
  const db = await seeded();
  const at = new Date("2026-11-02T08:00:00Z");
  await db.insert(timelogs).values({ id: "t1", employee_id: "e1", store_id: "s1", type: "IN", timestamp: at });

  const [log] = await db.select().from(timelogs);
  assert.equal(log.type, "IN");
  assert.equal(log.timestamp.toISOString(), at.toISOString());

  const [employee] = await db.select().from(employees);
  assert.equal(employee.status, "active");
});

test("qr_token is unique", async () => {
  const db = await seeded();
  await assert.rejects(db.insert(stores).values({ id: "s2", name: "Other", qr_token: "qr-1" }));
});

test("timelogs require an existing employee", async () => {
  const db = await seeded();
  await assert.rejects(
    db.insert(timelogs).values({ id: "t1", employee_id: "missing", store_id: "s1", type: "IN", timestamp: new Date() }),
  );
});

test("timelog type is limited to IN and OUT", async () => {
  const db = await seeded();
  await assert.rejects(
    db.insert(timelogs).values({
      id: "t1",
      employee_id: "e1",
      store_id: "s1",
      type: "BREAK" as "IN",
      timestamp: new Date(),
    }),
  );
});
