import assert from "node:assert/strict";
import { test } from "node:test";

import { verifyPin } from "../auth.js";
import { at, seededDb } from "../test-support.js";
import {
  createClockAction,
  createDemoStoreWithTimelogs,
  createEmployeeForStore,
  createStoreAndEmployees,
  getOwnerStoreRoster,
  getOwnerStoreSummaries,
  getReportsSnapshot,
  getScanRoster,
  getStoreByQrToken,
  getStoreTimelogs,
  saveReportCorrection,
  toPublicStore,
  updateEmployeeForStore,
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

test("clock-in after a clock-out appends an IN log", async () => {
  const db = await seededDb();
  const result = await createClockAction(db, "qr-1", "emp-1", "IN");
  assert.equal(result.action, "IN");
  const logs = await getStoreTimelogs(db, "store-1");
  assert.equal(logs.at(-1)?.employee_id, "emp-1");
  assert.equal(logs.at(-1)?.type, "IN");
});

test("rejects a clock action that repeats the current status", async () => {
  await assert.rejects(createClockAction(await seededDb(), "qr-1", "emp-2", "IN"), /invalid_transition/);
});

test("rejects clock actions for unknown stores and foreign employees", async () => {
  const db = await seededDb();
  await assert.rejects(createClockAction(db, "missing", "emp-1", "IN"), /store_not_found/);
  await assert.rejects(createClockAction(db, "qr-1", "emp-9", "IN"), /employee_store_mismatch/);
  await assert.rejects(createClockAction(db, "qr-1", "nobody", "IN"), /employee_not_found/);
});

test("concurrent identical clock-ins only record one", async () => {
  const db = await seededDb();
  const results = await Promise.allSettled([
    createClockAction(db, "qr-1", "emp-1", "IN"),
    createClockAction(db, "qr-1", "emp-1", "IN"),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const ins = (await getStoreTimelogs(db, "store-1")).filter((log) => log.employee_id === "emp-1" && log.type === "IN");
  assert.equal(ins.length, 2);
});

test("correction updates existing IN and OUT logs", async () => {
  const db = await seededDb();
  const result = await saveReportCorrection(db, {
    qrToken: "qr-1", employeeId: "emp-1", clockInLogId: "log-1", clockOutLogId: "log-2",
    clockInAt: at("2026-04-20T09:00:00Z"), clockOutAt: at("2026-04-20T17:00:00Z"),
  });
  assert.deepEqual(result, { ok: true, clockOutLogId: "log-2" });
  const logs = await getStoreTimelogs(db, "store-1");
  assert.equal(logs.find((log) => log.id === "log-1")?.timestamp.toISOString(), "2026-04-20T09:00:00.000Z");
  assert.equal(logs.find((log) => log.id === "log-2")?.timestamp.toISOString(), "2026-04-20T17:00:00.000Z");
});

test("correction creates the missing OUT log", async () => {
  const db = await seededDb();
  const result = await saveReportCorrection(db, {
    qrToken: "qr-1", employeeId: "emp-2", clockInLogId: "log-3", clockOutLogId: null,
    clockInAt: at("2026-04-21T08:00:00Z"), clockOutAt: at("2026-04-21T15:00:00Z"),
  });
  const created = (await getStoreTimelogs(db, "store-1")).find((log) => log.id === result.clockOutLogId);
  assert.equal(created?.type, "OUT");
  assert.equal(created?.employee_id, "emp-2");
});

test("correction rejects bad ranges, future times and mismatched logs", async () => {
  const db = await seededDb();
  const base = { qrToken: "qr-1", employeeId: "emp-1", clockInLogId: "log-1", clockOutLogId: "log-2" };
  await assert.rejects(
    saveReportCorrection(db, { ...base, clockInAt: at("2026-04-20T10:00:00Z"), clockOutAt: at("2026-04-20T09:00:00Z") }),
    /invalid_range/,
  );
  await assert.rejects(
    saveReportCorrection(db, { ...base, clockInAt: at("2026-04-20T10:00:00Z"), clockOutAt: new Date(Date.now() + 3_600_000) }),
    /future_correction_not_supported/,
  );
  await assert.rejects(
    saveReportCorrection(db, { ...base, clockInLogId: "log-2", clockInAt: at("2026-04-20T08:00:00Z"), clockOutAt: at("2026-04-20T09:00:00Z") }),
    /invalid_clock_in/,
  );
  const unchanged = (await getStoreTimelogs(db, "store-1")).find((log) => log.id === "log-1");
  assert.equal(unchanged?.timestamp.toISOString(), "2026-04-20T08:00:00.000Z");
});

test("creates a store with a hashed PIN and its employees", async () => {
  const db = await seededDb();
  const result = await createStoreAndEmployees(db, "  Corner Cafe ", "4321", ["Ana", " ", "Ben "]);
  assert.equal(result.storeName, "Corner Cafe");
  assert.equal(result.qrToken.length, 16);
  const roster = await getOwnerStoreRoster(db, result.storeId);
  assert.deepEqual(roster?.employees.map((employee) => employee.name), ["Ana", "Ben"]);
  const store = await getStoreByQrToken(db, result.qrToken);
  assert.equal(await verifyPin("4321", store!.pin_hash!), true);
});

test("creates the demo store with employees and timelogs", async () => {
  const db = await seededDb();
  const result = await createDemoStoreWithTimelogs(db);
  assert.equal(result.pin, "1234");
  const snapshot = await getReportsSnapshot(db, result.qrToken);
  assert.equal(snapshot?.employees.length, 4);
  assert.ok((snapshot?.timelogs.length ?? 0) > 20);
});

test("creates an active employee and rejects normalized duplicates", async () => {
  const db = await seededDb();
  const employee = await createEmployeeForStore(db, "store-1", "  Dana ");
  assert.equal(employee.name, "Dana");
  assert.equal(employee.status, "active");
  await assert.rejects(createEmployeeForStore(db, "store-1", "  ALEX "), /duplicate_employee_name/);
  await assert.rejects(createEmployeeForStore(db, "store-1", "  "), /invalid_employee_name/);
  await assert.rejects(createEmployeeForStore(db, "missing", "Eve"), /store_not_found/);
});

test("updates employee name and archive status", async () => {
  const db = await seededDb();
  const updated = await updateEmployeeForStore(db, { storeId: "store-1", employeeId: "emp-2", name: "Kimberly", status: "archived" });
  assert.equal(updated.name, "Kimberly");
  assert.equal(updated.status, "archived");
  await assert.rejects(updateEmployeeForStore(db, { storeId: "store-1", employeeId: "emp-1", name: "kimberly" }), /duplicate_employee_name/);
  await assert.rejects(updateEmployeeForStore(db, { storeId: "store-1", employeeId: "emp-1" }), /no_employee_changes/);
});

test("rejects employee updates across stores", async () => {
  const db = await seededDb();
  await assert.rejects(updateEmployeeForStore(db, { storeId: "store-1", employeeId: "emp-9", status: "archived" }), /employee_store_mismatch/);
  await assert.rejects(updateEmployeeForStore(db, { storeId: "store-1", employeeId: "nobody", status: "archived" }), /employee_not_found/);
});
