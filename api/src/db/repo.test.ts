import assert from "node:assert/strict";
import { test } from "node:test";

import { seededDb } from "../test-support.js";
import {
  getOwnerStoreRoster,
  getOwnerStoreSummaries,
  getReportsSnapshot,
  getScanRoster,
  getStoreByQrToken,
  toPublicStore,
} from "./repo.js";

test("lists owner store summaries newest first without pin hashes", async () => {
  const stores = await getOwnerStoreSummaries(await seededDb());
  assert.deepEqual(stores.map((store) => store.id), ["store-2", "store-1"]);
  assert.equal("pin_hash" in stores[0], false);
});

test("finds stores by qr token", async () => {
  const db = await seededDb();
  assert.equal((await getStoreByQrToken(db, "qr-1"))?.id, "store-1");
  assert.equal(await getStoreByQrToken(db, "missing"), null);
});

test("public store payload exposes only id, name and qr token", async () => {
  const store = await getStoreByQrToken(await seededDb(), "qr-1");
  assert.deepEqual(toPublicStore(store!), { id: "store-1", name: "Downtown", qr_token: "qr-1" });
});

test("builds scan roster statuses from each employee's latest log and hides archived staff", async () => {
  const roster = await getScanRoster(await seededDb(), "qr-1");
  assert.deepEqual(
    roster?.employees.map((entry) => [entry.employee.id, entry.status, entry.latestLog?.id ?? null]),
    [
      ["emp-1", "OUT", "log-2"],
      ["emp-2", "IN", "log-3"],
    ],
  );
  assert.equal(await getScanRoster(await seededDb(), "missing"), null);
});

test("owner roster keeps archived employees, active first", async () => {
  const roster = await getOwnerStoreRoster(await seededDb(), "store-1");
  assert.deepEqual(roster?.employees.map((employee) => employee.name), ["Alex", "Kim", "Bea"]);
  assert.equal(roster?.store.id, "store-1");
  assert.equal(await getOwnerStoreRoster(await seededDb(), "missing"), null);
});

test("reports snapshot returns all employees and time-ordered logs for one store", async () => {
  const snapshot = await getReportsSnapshot(await seededDb(), "qr-1");
  assert.equal(snapshot?.employees.length, 3);
  assert.deepEqual(snapshot?.timelogs.map((log) => log.id), ["log-1", "log-2", "log-3"]);
});
