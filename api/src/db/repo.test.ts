import assert from "node:assert/strict";
import { test } from "node:test";

import { at, seededDb } from "../test-support.js";
import {
  addManager,
  assignOwnerToAllStores,
  createClockAction,
  createDemoStoreWithTimelogs,
  createEmployeeForStore,
  createStoreAndEmployees,
  getMemberRole,
  getMemberships,
  getOwnerStoreRoster,
  getOwnerStoreSummaries,
  listMembers,
  removeManager,
  getReportsSnapshot,
  getScanRoster,
  getStoreByQrToken,
  getStoreTimelogs,
  saveReportCorrection,
  toPublicStore,
  updateEmployeeForStore,
} from "./repo.js";
import { createTestDb } from "./test-db.js";

test("lists owner store summaries for the owner only, newest first", async () => {
  const db = await seededDb();
  assert.deepEqual((await getOwnerStoreSummaries(db, "Alice@example.com")).map((store) => store.id), ["store-2", "store-1"]);
  assert.deepEqual((await getOwnerStoreSummaries(db, "carol@example.com")).map((store) => store.id), ["store-2"]);
  assert.deepEqual(await getOwnerStoreSummaries(db, "bob@example.com"), []);
});

test("finds stores by qr token", async () => {
  const db = await seededDb();
  assert.equal((await getStoreByQrToken(db, "qr-1"))?.id, "store-1");
  assert.equal(await getStoreByQrToken(db, "missing"), null);
});

test("public store payload exposes only id, name, qr token and mode", async () => {
  const store = await getStoreByQrToken(await seededDb(), "qr-1");
  assert.deepEqual(toPublicStore(store!), { id: "store-1", name: "Downtown", qr_token: "qr-1", qr_mode: "printed" });
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

test("creates a store, its employees and an owner membership", async () => {
  const db = await seededDb();
  const result = await createStoreAndEmployees(db, "  Corner Cafe ", "Dave@Example.com", ["Ana", " ", "Ben "]);
  assert.equal(result.storeName, "Corner Cafe");
  assert.equal(result.qrToken.length, 16);
  const roster = await getOwnerStoreRoster(db, result.storeId);
  assert.deepEqual(roster?.employees.map((employee) => employee.name), ["Ana", "Ben"]);
  assert.equal(await getMemberRole(db, result.storeId, "dave@example.com"), "owner");
});

test("creates the demo store with employees, timelogs and an owner", async () => {
  const db = await seededDb();
  const result = await createDemoStoreWithTimelogs(db, "dave@example.com");
  assert.equal(await getMemberRole(db, result.storeId, "dave@example.com"), "owner");
  const snapshot = await getReportsSnapshot(db, result.qrToken);
  assert.equal(snapshot?.employees.length, 4);
  assert.ok((snapshot?.timelogs.length ?? 0) > 20);
});

test("managers can be added once, listed, and removed; owners cannot be removed", async () => {
  const db = await seededDb();
  assert.deepEqual(await addManager(db, "store-2", " Zed@Example.com "), { email: "zed@example.com", role: "manager" });
  await assert.rejects(addManager(db, "store-2", "zed@example.com"), /already_member/);
  await assert.rejects(addManager(db, "store-2", "not an email"), /invalid_email/);
  assert.deepEqual(await listMembers(db, "store-2"), [
    { email: "alice@example.com", role: "owner" },
    { email: "carol@example.com", role: "owner" },
    { email: "zed@example.com", role: "manager" },
  ]);
  await assert.rejects(removeManager(db, "store-2", "carol@example.com"), /cannot_remove_owner/);
  await removeManager(db, "store-2", "ZED@example.com");
  await assert.rejects(removeManager(db, "store-2", "zed@example.com"), /member_not_found/);
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

test("correction rolls back the IN update when the OUT log is invalid", async () => {
  const db = await seededDb();
  await assert.rejects(
    saveReportCorrection(db, {
      qrToken: "qr-1", employeeId: "emp-1", clockInLogId: "log-1", clockOutLogId: "log-1",
      clockInAt: at("2026-04-20T07:00:00Z"), clockOutAt: at("2026-04-20T12:00:00Z"),
    }),
    /invalid_clock_out/,
  );
  const logIn = (await getStoreTimelogs(db, "store-1")).find((log) => log.id === "log-1");
  assert.equal(logIn?.timestamp.toISOString(), "2026-04-20T08:00:00.000Z");
});

test("member roles resolve per store and ignore email case", async () => {
  const db = await seededDb();
  assert.equal(await getMemberRole(db, "store-1", "ALICE@example.com"), "owner");
  assert.equal(await getMemberRole(db, "store-1", "bob@example.com"), "manager");
  assert.equal(await getMemberRole(db, "store-2", "bob@example.com"), null);
  assert.equal(await getMemberRole(db, "missing", "alice@example.com"), null);
});

test("memberships list the user's stores newest first with their role", async () => {
  const rows = await getMemberships(await seededDb(), "alice@example.com");
  assert.deepEqual(rows.map((row) => [row.id, row.role]), [
    ["store-2", "owner"],
    ["store-1", "owner"],
  ]);
  assert.deepEqual(await getMemberships(await seededDb(), "nobody@example.com"), []);
});

test("assignOwnerToAllStores is idempotent, normalizes case and upgrades managers", async () => {
  const db = await seededDb();
  assert.equal(await assignOwnerToAllStores(db, " Bob@Example.com "), 2);
  assert.equal(await getMemberRole(db, "store-1", "bob@example.com"), "owner");
  assert.equal(await getMemberRole(db, "store-2", "bob@example.com"), "owner");
  assert.equal(await assignOwnerToAllStores(db, "bob@example.com"), 2);
});

test("assignOwnerToAllStores returns 0 without stores and keeps existing owners", async () => {
  assert.equal(await assignOwnerToAllStores(await createTestDb(), "alice@example.com"), 0);
  const db = await seededDb();
  assert.equal(await assignOwnerToAllStores(db, "alice@example.com"), 2);
  assert.equal(await getMemberRole(db, "store-1", "alice@example.com"), "owner");
});
