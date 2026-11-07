import assert from "node:assert/strict";
import { test } from "node:test";

import { buildDemoStoreSeed } from "./demo-data.js";

test("builds deterministic demo seed data", () => {
  const seed = buildDemoStoreSeed(new Date("2026-04-06T12:00:00"));
  assert.equal(seed.storeName, "Demo Payroll Store");
  assert.equal(seed.pin, "1234");
  assert.deepEqual(seed.employeeNames, ["Kim", "Alex", "Maria", "Noah"]);
  assert.ok(seed.timelogs.length > 20);
  assert.equal(seed.timelogs[0]?.type, "IN");
});
