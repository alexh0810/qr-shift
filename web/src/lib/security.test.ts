import assert from "node:assert/strict";

import {
  createManagerSessionValue,
  createOwnerSessionValue,
  isManagerSessionAuthorized,
  readManagerSessionFromValue,
  readOwnerSessionFromValue,
  verifyOwnerSecret,
} from "./server-auth";
import { hashPin, verifyPin } from "./pin-hash";

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

process.env.MANAGER_SESSION_SECRET = process.env.MANAGER_SESSION_SECRET ?? "manager-test-secret";
process.env.OWNER_SETUP_SECRET = process.env.OWNER_SETUP_SECRET ?? "owner-test-secret";

const tests: TestCase[] = [
  {
    name: "hashes and verifies manager PIN values",
    run: async () => {
      const pinHash = await hashPin("1234");

      assert.notEqual(pinHash, "1234");
      assert.equal(await verifyPin("1234", pinHash), true);
      assert.equal(await verifyPin("9999", pinHash), false);
    },
  },
  {
    name: "creates and validates manager sessions scoped to one qr token",
    run: () => {
      const value = createManagerSessionValue("store-1", "token-123");
      const session = readManagerSessionFromValue(value);

      assert.ok(session);
      assert.equal(session?.storeId, "store-1");
      assert.equal(session?.qrToken, "token-123");
      assert.equal(isManagerSessionAuthorized(session, "token-123"), true);
      assert.equal(isManagerSessionAuthorized(session, "token-999"), false);
    },
  },
  {
    name: "rejects tampered manager sessions",
    run: () => {
      const value = createManagerSessionValue("store-1", "token-123");
      const tampered = `${value}tampered`;

      assert.equal(readManagerSessionFromValue(tampered), null);
    },
  },
  {
    name: "creates and validates owner sessions",
    run: () => {
      const value = createOwnerSessionValue();
      const session = readOwnerSessionFromValue(value);

      assert.ok(session);
      assert.equal(session?.kind, "owner");
    },
  },
  {
    name: "verifies owner secret with constant-time comparison path",
    run: () => {
      assert.equal(verifyOwnerSecret("owner-test-secret"), true);
      assert.equal(verifyOwnerSecret("wrong-secret"), false);
    },
  },
];

let failed = 0;

async function run() {
  for (const currentTest of tests) {
    try {
      await currentTest.run();
      console.log(`PASS ${currentTest.name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${currentTest.name}`);
      console.error(error);
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
    throw new Error(`${failed} security test(s) failed`);
  }

  console.log(`Passed ${tests.length} security tests`);
}

run().catch((error) => {
  throw error;
});
