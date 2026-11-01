import assert from "node:assert/strict";
import { test } from "node:test";

import "./test-support.js";
import {
  createManagerSessionValue,
  createOwnerSessionValue,
  hashPin,
  isManagerSessionAuthorized,
  readManagerSessionFromValue,
  readOwnerSessionFromValue,
  verifyOwnerSecret,
  verifyPin,
} from "./auth.js";

test("hashes and verifies manager PIN values", async () => {
  const hash = await hashPin("1234");
  assert.match(hash, /^scrypt\$/);
  assert.equal(await verifyPin("1234", hash), true);
  assert.equal(await verifyPin("9999", hash), false);
  assert.equal(await verifyPin("1234", "not-a-hash"), false);
});

test("manager sessions are scoped to one qr token", () => {
  const session = readManagerSessionFromValue(createManagerSessionValue("store-1", "qr-1"));
  assert.equal(session?.storeId, "store-1");
  assert.equal(isManagerSessionAuthorized(session, "qr-1"), true);
  assert.equal(isManagerSessionAuthorized(session, "qr-2"), false);
  assert.equal(isManagerSessionAuthorized(null, "qr-1"), false);
});

test("tampered manager sessions are rejected", () => {
  const [payload, signature] = createManagerSessionValue("store-1", "qr-1").split(".");
  const forged = Buffer.from(JSON.stringify({ kind: "manager", storeId: "store-2", qrToken: "qr-2", exp: Date.now() + 60_000 })).toString("base64url");
  assert.equal(readManagerSessionFromValue(`${forged}.${signature}`), null);
  assert.equal(readManagerSessionFromValue(`${payload}.bad`), null);
  assert.equal(readManagerSessionFromValue(undefined), null);
});

test("owner sessions validate and are not accepted as manager sessions", () => {
  const value = createOwnerSessionValue();
  assert.equal(readOwnerSessionFromValue(value)?.kind, "owner");
  assert.equal(readManagerSessionFromValue(value), null);
});

test("owner secret comparison", () => {
  assert.equal(verifyOwnerSecret("test-owner-secret"), true);
  assert.equal(verifyOwnerSecret("wrong"), false);
  assert.equal(verifyOwnerSecret(""), false);
});
