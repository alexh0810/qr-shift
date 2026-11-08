import assert from "node:assert/strict";
import { test } from "node:test";

import { createTestDb } from "../db/test-db.js";
import { diffRows, readAll, replaceAll, toRows, type FirestoreSnapshot } from "./firestore-import.js";

const timestamp = (iso: string) => ({ toDate: () => new Date(iso) });

function snapshot(): FirestoreSnapshot {
  return {
    stores: [{ id: "s1", data: { name: "Cafe", qr_token: "qr", pin_hash: "scrypt$a$b", created_at: timestamp("2026-04-01T00:00:00Z") } }],
    employees: [
      { id: "e1", data: { name: "Ana", store_id: "s1", created_at: timestamp("2026-04-01T00:00:00Z") } },
      { id: "e2", data: { name: "Ben", store_id: "s1", status: "archived", created_at: timestamp("2026-04-02T00:00:00Z") } },
    ],
    timelogs: [{ id: "t1", data: { employee_id: "e1", store_id: "s1", type: "IN", timestamp: timestamp("2026-04-03T08:00:00Z") } }],
  };
}

test("maps Firestore documents to rows, defaulting legacy employees to active", () => {
  const rows = toRows(snapshot());
  assert.equal(rows.stores[0].created_at.toISOString(), "2026-04-01T00:00:00.000Z");
  assert.deepEqual(rows.employees.map((employee) => employee.status), ["active", "archived"]);
  assert.equal(rows.timelogs[0].type, "IN");
});

test("refuses stores that only have a plaintext PIN", () => {
  const input = snapshot();
  input.stores[0].data = { ...input.stores[0].data, pin_hash: undefined, pin: "1234" };
  assert.throws(() => toRows(input), /plaintext PIN.*migrate:pins/);
});

test("refuses missing timestamps instead of inventing them", () => {
  const input = snapshot();
  input.timelogs[0].data = { ...input.timelogs[0].data, timestamp: undefined };
  assert.throws(() => toRows(input), /timelogs\/t1.*timestamp/);
});

test("refuses unknown timelog types and orphaned references", () => {
  const badType = snapshot();
  badType.timelogs[0].data = { ...badType.timelogs[0].data, type: "BREAK" };
  assert.throws(() => toRows(badType), /timelogs\/t1.*type/);

  const orphan = snapshot();
  orphan.timelogs[0].data = { ...orphan.timelogs[0].data, employee_id: "ghost" };
  assert.throws(() => toRows(orphan), /timelogs\/t1.*employee ghost/);
});

test("replaceAll is re-runnable and the read-back matches exactly", async () => {
  const db = await createTestDb();
  const rows = toRows(snapshot());
  await replaceAll(db, rows);
  await replaceAll(db, rows);
  assert.deepEqual(diffRows(rows, await readAll(db)), []);
});

test("diffRows reports changed, missing and extra rows", async () => {
  const rows = toRows(snapshot());
  const changed = structuredClone(rows);
  changed.employees[0].name = "Anna";
  changed.timelogs = [];
  const diff = diffRows(rows, changed);
  assert.ok(diff.some((line) => line.includes("employees/e1")));
  assert.ok(diff.some((line) => line.includes("timelogs/t1")));
});
