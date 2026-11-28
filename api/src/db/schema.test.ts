import assert from "node:assert/strict";
import { test } from "node:test";

import { eq } from "drizzle-orm";

import { createTestDb } from "./test-db.js";
import { corrections, employees, storeMembers, stores, timelogs } from "./schema.js";

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

test("store_members is unique per store and email and needs an existing store", async () => {
  const db = await seeded();
  await db.insert(storeMembers).values({ store_id: "s1", email: "a@example.com", role: "owner" });
  await assert.rejects(db.insert(storeMembers).values({ store_id: "s1", email: "a@example.com", role: "manager" }));
  await assert.rejects(db.insert(storeMembers).values({ store_id: "nope", email: "a@example.com", role: "owner" }));
});

test("corrections reject short reasons and block deleting an audited timelog", async () => {
  const db = await seeded();
  const when = new Date("2026-11-02T08:00:00Z");
  await db.insert(timelogs).values({ id: "t1", employee_id: "e1", store_id: "s1", type: "IN", timestamp: when });
  const row = { timelog_id: "t1", old_timestamp: when, new_timestamp: new Date("2026-11-02T09:00:00Z"), changed_by: "bob@example.com" };

  await assert.rejects(db.insert(corrections).values({ id: "c1", ...row, reason: "ab" }));
  await assert.rejects(db.insert(corrections).values({ id: "c2", ...row, reason: "  x " }));
  await assert.rejects(db.insert(corrections).values({ id: "c3", ...row, reason: "x".repeat(501) }));

  await db.insert(corrections).values({ id: "c4", ...row, reason: "Forgot to clock" });
  await assert.rejects(db.delete(timelogs).where(eq(timelogs.id, "t1")));
});
